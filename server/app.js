import compression from 'compression';
import express from 'express';
import helmet from 'helmet';
import fs from 'node:fs/promises';
import path from 'node:path';
import multer from 'multer';
import { PDFParse } from 'pdf-parse';
import { fileURLToPath } from 'node:url';
import { loadConfig } from './config.js';
import { createMeeting, normalizeTopic } from './meeting.js';
import { createModelProvider } from './model-providers.js';
import { saveProjectSnapshot } from './project-files.js';
import { createFixedWindowRateLimit } from './rate-limit.js';
import { getShare, saveShare } from './shares.js';
import { buildSessionCookie, createSessionToken, hasValidSession } from './session.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultRootDir = path.resolve(__dirname, '..');

function publicHealth(config) {
  const configured = config.roundtable.configuredProviders;
  const providerLabel = configured.length > 1 ? '多 API 圆桌' : config.ai.name;
  const modelLabel = configured.length > 1
    ? configured.map((id) => `${config.providers[id].name}:${config.providers[id].model}`).join(' + ')
    : config.ai.model;
  return {
    ok: true,
    aiConfigured: configured.length > 0,
    accessRequired: Boolean(config.accessCode),
    provider: config.ai.id,
    providerName: providerLabel,
    model: modelLabel,
    configuredProviders: configured,
    dailyMeetingLimit: config.security.dailyMeetingLimit,
  };
}

function applySecurity(app, config) {
  if (!config.isProduction) return;
  app.use(helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "img-src": ["'self'", 'data:'],
        "connect-src": ["'self'"],
        "font-src": ["'self'"],
        "object-src": ["'none'"],
      },
    },
  }));
}

function classifyGenerationError(error) {
  if (error?.name === 'ZodError') {
    return {
      error: '模型返回结构不符合约定，请重试',
      reason: 'schema_mismatch',
    };
  }

  const status = Number(error?.status ?? error?.response?.status);
  const message = String(error?.message || '');
  if (status === 401 || status === 403 || /api key|auth|unauthorized|forbidden/i.test(message)) {
    return {
      error: '模型服务认证失败，请检查 API Key 是否正确。',
      reason: 'provider_auth_error',
    };
  }
  if (status === 404 || /model.*not found|model.*does not exist|invalid model/i.test(message)) {
    return {
      error: '模型名称不可用，请检查 .env 中的 MODEL 配置。',
      reason: 'provider_model_error',
    };
  }
  if (status === 429 || /rate limit|quota|too many requests/i.test(message)) {
    return {
      error: '模型服务额度或频率受限，请稍后再试或更换供应商。',
      reason: 'provider_rate_limit',
    };
  }
  if (/fetch failed|network|timeout|ETIMEDOUT|ECONN|ENOTFOUND|invalid url/i.test(message)) {
    return {
      error: '模型服务连接失败，请检查 BASE_URL 和网络连接。',
      reason: 'provider_connection_error',
    };
  }

  return {
    error: '会议生成失败，请稍后再试',
    reason: 'generation_failed',
  };
}

function isSchemaMismatch(error) {
  return error?.name === 'ZodError';
}

async function attachClientAssets(app, { config, rootDir }) {
  const distDir = path.join(rootDir, 'dist');
  if (config.isProduction) {
    app.use(express.static(distDir, { index: false, maxAge: '1y' }));
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api/')) return next();
      return res.sendFile(path.join(distDir, 'index.html'));
    });
    return;
  }

  const { createServer } = await import('vite');
  const vite = await createServer({
    root: rootDir,
    appType: 'custom',
    server: { middlewareMode: true },
  });
  app.use(vite.middlewares);
  app.use(async (req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api/')) return next();
    try {
      const template = await fs.readFile(path.join(rootDir, 'index.html'), 'utf-8');
      const html = await vite.transformIndexHtml(req.originalUrl, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (error) {
      vite.ssrFixStacktrace(error);
      next(error);
    }
  });
}

function registerApiRoutes(app, {
  config,
  providerFactory,
  generateMeeting,
  logger,
  rootDir,
}) {
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

  app.get('/api/health', (req, res) => {
    res.json(publicHealth(config));
  });

  app.post('/api/extract-text', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: '未提供文件' });
    try {
      if (req.file.mimetype === 'application/pdf') {
        const parser = new PDFParse({ data: req.file.buffer });
        try {
          const data = await parser.getText();
          return res.json({ text: data.text });
        } finally {
          await parser.destroy();
        }
      }
      return res.status(400).json({ error: '仅支持 PDF 文件解析' });
    } catch (error) {
      logger.error(error);
      return res.status(500).json({ error: '文件解析失败' });
    }
  });

  app.get('/api/project-files', (req, res) => {
    res.json({ folder: path.join(rootDir, 'roundtable-projects') });
  });

  app.post('/api/project-files', async (req, res) => {
    try {
      const result = await saveProjectSnapshot({
        rootDir,
        projects: req.body?.projects,
        archivedProjects: req.body?.archivedProjects,
      });
      return res.json({ ok: true, ...result });
    } catch (error) {
      logger.error(error);
      return res.status(500).json({ error: '项目本地文件夹同步失败' });
    }
  });

  app.post('/api/sessions', (req, res) => {
    if (!config.accessCode) return res.json({ ok: true });
    if (req.body?.accessCode !== config.accessCode) {
      return res.status(401).json({ error: '访问码不正确' });
    }
    const token = createSessionToken({
      secret: config.security.sessionSecret,
      maxAgeMs: config.security.sessionMaxAgeMs,
    });
    res.setHeader('Set-Cookie', buildSessionCookie(token, config));
    return res.json({ ok: true });
  });

  app.get('/api/shares/:id', async (req, res) => {
    try {
      const share = await getShare({ rootDir, id: req.params.id });
      if (!share) return res.status(404).json({ error: '分享记录不存在或已过期' });
      return res.json(share);
    } catch (error) {
      logger.error(error);
      return res.status(500).json({ error: '获取分享内容失败' });
    }
  });

  app.post('/api/shares', async (req, res) => {
    if (!req.body?.meeting) {
      return res.status(400).json({ error: '分享内容不能为空' });
    }
    try {
      const id = await saveShare({ rootDir, meeting: req.body.meeting });
      return res.json({ id });
    } catch (error) {
      logger.error(error);
      return res.status(500).json({ error: '生成分享链接失败' });
    }
  });

  app.post('/api/meetings', async (req, res) => {
    try {
      normalizeTopic(req.body?.topic);
    } catch (error) {
      return res.status(400).json({ error: error.message, reason: 'validation_error' });
    }

    if (config.accessCode && !hasValidSession(req, config)) {
      return res.status(401).json({ error: '请先完成访问验证', reason: 'auth_required' });
    }

    if (config.roundtable.configuredProviders.length === 0) {
      const keyName = `${config.ai.id.toUpperCase()}_API_KEY`;
      return res.status(503).json({
        error: `服务端未配置 API Key（${keyName}），暂时不能生成真实会议。请在 .env 中填写后重启服务。`,
        reason: 'no_api_key',
        keyName,
      });
    }

    try {
      const request = {
        provider: providerFactory(config),
        topic: req.body?.topic,
        presetId: req.body?.presetId,
        context: req.body?.context,
        personas: req.body?.personas,
      };
      const meeting = await generateMeeting({
        ...request,
      }).catch((error) => {
        if (!isSchemaMismatch(error)) throw error;
        logger.warn?.('模型返回结构不符合约定，自动重试一次。');
        return generateMeeting(request);
      });
      return res.json(meeting);
    } catch (error) {
      logger.error(error);
      return res.status(502).json(classifyGenerationError(error));
    }
  });
}

export async function createApp({
  config = loadConfig(),
  rootDir = defaultRootDir,
  attachClient = true,
  providerFactory = createModelProvider,
  generateMeeting = createMeeting,
  logger = console,
} = {}) {
  const app = express();
  app.set('trust proxy', 1);
  app.use(compression());
  app.use(express.json({ limit: '2mb' }));
  applySecurity(app, config);
  app.use(createFixedWindowRateLimit());
  app.use(createFixedWindowRateLimit({
    max: config.security.dailyMeetingLimit,
    windowMs: 24 * 60 * 60 * 1000,
    message: '今日生成额度已用完，请明天再试',
  }));
  registerApiRoutes(app, { config, providerFactory, generateMeeting, logger, rootDir });

  if (attachClient) {
    await attachClientAssets(app, { config, rootDir });
  }

  return app;
}
