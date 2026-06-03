import { createServer } from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createApp } from './app.js';
import { loadConfig } from './config.js';

const servers = [];
const createdDirs = [];

async function request(app, { method = 'GET', path = '/', headers = {}, body } = {}) {
  const server = createServer(app);
  servers.push(server);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json', ...headers } : headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  return {
    status: response.status,
    headers: response.headers,
    body: text ? JSON.parse(text) : null,
  };
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise((resolve) => server.close(resolve))));
  await Promise.all(createdDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

async function tempRoot() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'roundtable-app-'));
  createdDirs.push(dir);
  return dir;
}

describe('createApp', () => {
  test('reports public health without leaking secrets', async () => {
    const app = await createApp({
      config: loadConfig({ OPENAI_API_KEY: 'secret-key', APP_ACCESS_CODE: 'private' }),
      attachClient: false,
    });

    const response = await request(app, { path: '/api/health' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      aiConfigured: true,
      accessRequired: true,
      provider: 'openai',
      providerName: 'OpenAI',
      model: 'gpt-5.5',
      configuredProviders: ['openai'],
      dailyMeetingLimit: 80,
    });
  });

  test('reports provider pool health when multiple providers are configured', async () => {
    const app = await createApp({
      config: loadConfig({
        AI_PROVIDERS: 'openai,deepseek,glm',
        OPENAI_API_KEY: 'openai-key',
        DEEPSEEK_API_KEY: 'deepseek-key',
        GLM_API_KEY: 'glm-key',
      }),
      attachClient: false,
    });

    const response = await request(app, { path: '/api/health' });

    expect(response.status).toBe(200);
    expect(response.body.providerName).toBe('多 API 圆桌');
    expect(response.body.model).toContain('OpenAI:gpt-5.5');
    expect(response.body.model).toContain('DeepSeek:deepseek-chat');
    expect(response.body.model).toContain('GLM:glm-4.5');
    expect(response.body.configuredProviders).toEqual(['openai', 'deepseek', 'glm']);
  });

  test('syncs browser projects into a local project folder', async () => {
    const rootDir = await tempRoot();
    const app = await createApp({
      config: loadConfig({}),
      attachClient: false,
      rootDir,
    });

    const response = await request(app, {
      method: 'POST',
      path: '/api/project-files',
      body: {
        projects: [{ id: 'project-1', name: '本地项目', meetings: [], memory: { summaries: [], risks: [], actions: [] } }],
        archivedProjects: [],
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.folder).toBe(path.join(rootDir, 'roundtable-projects'));
    await expect(fs.readFile(path.join(response.body.folder, 'active-projects.json'), 'utf8')).resolves.toContain('本地项目');
  });

  test('rejects empty topics before model setup', async () => {
    const app = await createApp({ config: loadConfig({}), attachClient: false });

    const response = await request(app, {
      method: 'POST',
      path: '/api/meetings',
      body: { topic: '' },
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('请输入会议议题');
  });

  test('requires access code when configured', async () => {
    const app = await createApp({
      config: loadConfig({ OPENAI_API_KEY: 'secret-key', APP_ACCESS_CODE: 'private' }),
      attachClient: false,
    });

    const response = await request(app, {
      method: 'POST',
      path: '/api/meetings',
      body: { topic: '测试' },
    });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('请先完成访问验证');
  });

  test('exchanges the access code for an httpOnly session cookie', async () => {
    const app = await createApp({
      config: loadConfig({ OPENAI_API_KEY: 'secret-key', APP_ACCESS_CODE: 'private' }),
      attachClient: false,
    });

    const response = await request(app, {
      method: 'POST',
      path: '/api/sessions',
      body: { accessCode: 'private' },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toContain('roundtable_session=');
    expect(response.headers.get('set-cookie')).toContain('HttpOnly');
  });

  test('regenerates a single turn via injected handler', async () => {
    const regenerateTurn = vi.fn().mockResolvedValue({
      meeting: {
        title: '测试会议',
        turns: [
          { speaker: 'du', text: '开场' },
          { speaker: 'zhuo', text: '重生成后' },
        ],
        vote: { question: '是否推进？', results: {}, summary: '推进' },
        risks: [],
        actions: [],
        workspace: { candidateOptions: [], openQuestions: [], tensions: [], evidencePool: [] },
        memoryDiff: { decisions: [], risks: [], assumptions: [], disagreements: [], actions: [] },
      },
      meta: { turnIndex: 1, previousTurn: { speaker: 'zhuo', text: '旧版' } },
    });
    const app = await createApp({
      config: loadConfig({ OPENAI_API_KEY: 'secret-key' }),
      attachClient: false,
      regenerateTurn,
    });

    const response = await request(app, {
      method: 'POST',
      path: '/api/meetings/regenerate-turn',
      body: {
        topic: '测试',
        turnIndex: 1,
        meeting: {
          title: '测试会议',
          turns: [
            { speaker: 'du', text: '开场' },
            { speaker: 'zhuo', text: '旧版' },
          ],
          vote: { question: '是否推进？', results: {}, summary: '推进' },
          risks: [],
          actions: [],
        },
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.meeting.turns[1].text).toBe('重生成后');
    expect(regenerateTurn).toHaveBeenCalledWith(expect.objectContaining({ turnIndex: 1 }));
  });

  test('uses injected meeting generator for route behavior', async () => {
    const generateMeeting = vi.fn().mockResolvedValue({
      title: '测试会议',
      turns: [{ speaker: 'du', text: '开场' }],
      vote: { question: '是否推进？', results: {}, summary: '推进' },
      risks: [],
      actions: [],
    });
    const app = await createApp({
      config: loadConfig({ OPENAI_API_KEY: 'secret-key' }),
      attachClient: false,
      generateMeeting,
    });

    const response = await request(app, {
      method: 'POST',
      path: '/api/meetings',
      body: { topic: '测试' },
    });

    expect(response.status).toBe(200);
    expect(response.body.title).toBe('测试会议');
    expect(generateMeeting).toHaveBeenCalledWith(expect.objectContaining({
      topic: '测试',
      provider: expect.any(Object),
    }));
  });

  test('accepts detailed multiline Chinese topics', async () => {
    const generateMeeting = vi.fn().mockResolvedValue({
      title: '测试会议',
      turns: [{ speaker: 'du', text: '开场' }],
      vote: { question: '是否推进？', results: {}, summary: '推进' },
      risks: [],
      actions: [],
    });
    const topic = `AI Agent 对个人用户而言，真正的核心竞争力，究竟是更聪明的模型，还是更懂你的工作流？

当 AI Agent 开始进入个人生活与日常工作，人们真正需要的，究竟是一个“更强的大脑”，还是一个“更懂自己习惯”的数字助手？

* 用户会更在意 Agent “聪不聪明”，还是“懂不懂我”？
* Personal AI Agent 是否会成为每个人的第二大脑？
* 用户会愿意把日程、邮件、文件甚至决策权交给 AI Agent 吗？`;
    const app = await createApp({
      config: loadConfig({ OPENAI_API_KEY: 'secret-key' }),
      attachClient: false,
      generateMeeting,
    });

    const response = await request(app, {
      method: 'POST',
      path: '/api/meetings',
      body: { topic },
    });

    expect(response.status).toBe(200);
    expect(generateMeeting).toHaveBeenCalledWith(expect.objectContaining({ topic }));
  });

  test('retries once when model output fails schema validation', async () => {
    const schemaError = Object.assign(new Error('invalid structure'), { name: 'ZodError' });
    const generateMeeting = vi.fn()
      .mockRejectedValueOnce(schemaError)
      .mockResolvedValue({
        title: '重试成功',
        turns: [{ speaker: 'du', text: '开场' }],
        vote: { question: '是否推进？', results: {}, summary: '推进' },
        risks: [],
        actions: [],
      });
    const logger = { error: vi.fn(), warn: vi.fn() };
    const app = await createApp({
      config: loadConfig({ OPENAI_API_KEY: 'secret-key' }),
      attachClient: false,
      generateMeeting,
      logger,
    });

    const response = await request(app, {
      method: 'POST',
      path: '/api/meetings',
      body: { topic: '测试' },
    });

    expect(response.status).toBe(200);
    expect(response.body.title).toBe('重试成功');
    expect(generateMeeting).toHaveBeenCalledTimes(2);
    expect(logger.warn).toHaveBeenCalledWith('模型返回结构不符合约定，自动重试一次。');
  });

  test('accepts meetings after session verification', async () => {
    const generateMeeting = vi.fn().mockResolvedValue({
      title: '测试会议',
      turns: [{ speaker: 'du', text: '开场' }],
      vote: { question: '是否推进？', results: {}, summary: '推进' },
      risks: [],
      actions: [],
    });
    const app = await createApp({
      config: loadConfig({ OPENAI_API_KEY: 'secret-key', APP_ACCESS_CODE: 'private' }),
      attachClient: false,
      generateMeeting,
    });
    const session = await request(app, {
      method: 'POST',
      path: '/api/sessions',
      body: { accessCode: 'private' },
    });

    const response = await request(app, {
      method: 'POST',
      path: '/api/meetings',
      headers: { cookie: session.headers.get('set-cookie') },
      body: { topic: '测试' },
    });

    expect(response.status).toBe(200);
    expect(response.body.title).toBe('测试会议');
  });

  test('reports the missing key for the active provider', async () => {
    const app = await createApp({
      config: loadConfig({ AI_PROVIDER: 'claude' }),
      attachClient: false,
    });

    const response = await request(app, {
      method: 'POST',
      path: '/api/meetings',
      body: { topic: '测试' },
    });

    expect(response.status).toBe(503);
    expect(response.body.error).toContain('CLAUDE_API_KEY');
    expect(response.body.reason).toBe('no_api_key');
    expect(response.body.keyName).toBe('CLAUDE_API_KEY');
  });

  test('reports provider authentication errors without leaking raw provider output', async () => {
    const generateMeeting = vi.fn().mockRejectedValue(Object.assign(new Error('Incorrect API key provided'), {
      status: 401,
    }));
    const app = await createApp({
      config: loadConfig({ OPENAI_API_KEY: 'secret-key' }),
      attachClient: false,
      generateMeeting,
      logger: { error: vi.fn() },
    });

    const response = await request(app, {
      method: 'POST',
      path: '/api/meetings',
      body: { topic: '测试' },
    });

    expect(response.status).toBe(502);
    expect(response.body.reason).toBe('provider_auth_error');
    expect(response.body.error).toBe('模型服务认证失败，请检查 API Key 是否正确。');
  });

  test('topic admission API returns fit assessment', async () => {
    const app = await createApp({
      config: loadConfig({ OPENAI_API_KEY: 'secret-key' }),
      attachClient: false,
    });

    const good = await request(app, {
      method: 'POST',
      path: '/api/topics/admission',
      body: { topic: '我们是否应该在 Q3 上线收费，风险与路径如何权衡？' },
    });
    expect(good.status).toBe(200);
    expect(good.body.fit).toBe('roundtable_recommended');

    const weak = await request(app, {
      method: 'POST',
      path: '/api/topics/admission',
      body: { topic: '什么是 OKR' },
    });
    expect(weak.status).toBe(200);
    expect(weak.body.fit).toBe('single_model_better');
    expect(weak.body.requiresConfirm).toBe(true);
  });

  test('reports provider rate limits as an actionable public reason', async () => {
    const generateMeeting = vi.fn().mockRejectedValue(Object.assign(new Error('Rate limit reached'), {
      status: 429,
    }));
    const app = await createApp({
      config: loadConfig({ OPENAI_API_KEY: 'secret-key' }),
      attachClient: false,
      generateMeeting,
      logger: { error: vi.fn() },
    });

    const response = await request(app, {
      method: 'POST',
      path: '/api/meetings',
      body: { topic: '测试' },
    });

    expect(response.status).toBe(502);
    expect(response.body.reason).toBe('provider_rate_limit');
    expect(response.body.error).toBe('模型服务额度或频率受限，请稍后再试或更换供应商。');
  });
});
