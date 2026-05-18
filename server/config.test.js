import { describe, expect, test } from 'vitest';
import { loadConfig } from './config.js';

describe('loadConfig', () => {
  test('uses safe development defaults', () => {
    const config = loadConfig({});

    expect(config.env).toBe('development');
    expect(config.host).toBe('127.0.0.1');
    expect(config.port).toBe(5173);
    expect(config.ai.id).toBe('openai');
    expect(config.openai.model).toBe('gpt-5.5');
    expect(config.openai.maxTokens).toBe(8192);
    expect(config.security.dailyMeetingLimit).toBe(80);
    expect(config.security.sessionMaxAgeMs).toBe(12 * 60 * 60 * 1000);
  });

  test('uses public host in production unless overridden', () => {
    const config = loadConfig({ NODE_ENV: 'production', PORT: '8080' });

    expect(config.env).toBe('production');
    expect(config.host).toBe('0.0.0.0');
    expect(config.port).toBe(8080);
  });

  test('rejects invalid ports early', () => {
    expect(() => loadConfig({ PORT: 'abc' })).toThrow('PORT 必须是 1-65535 的整数');
  });

  test('can select a Claude-compatible provider', () => {
    const config = loadConfig({ AI_PROVIDER: 'claude', CLAUDE_API_KEY: 'secret' });

    expect(config.ai.id).toBe('claude');
    expect(config.ai.apiKey).toBe('secret');
    expect(config.ai.model).toBe('claude-sonnet-4-5-20250929');
  });

  test('auto-selects Claude when only a Claude key is present', () => {
    const config = loadConfig({ CLAUDE_API_KEY: 'secret' });

    expect(config.ai.id).toBe('claude');
  });

  test('can configure arbitrary OpenAI-compatible providers', () => {
    const config = loadConfig({
      AI_PROVIDERS: 'openai,deepseek,glm,custom1,custom2',
      DEEPSEEK_API_KEY: 'deepseek-key',
      GLM_API_KEY: 'glm-key',
      CUSTOM1_API_KEY: 'custom-key',
      CUSTOM1_BASE_URL: 'https://example.com/v1',
      CUSTOM1_MODEL: 'custom-model',
    });

    expect(config.roundtable.providerIds).toEqual(['openai', 'deepseek', 'glm', 'custom1', 'custom2']);
    expect(config.providers.deepseek.baseUrl).toBe('https://api.deepseek.com');
    expect(config.providers.glm.baseUrl).toBe('https://open.bigmodel.cn/api/paas/v4');
    expect(config.providers.custom1.model).toBe('custom-model');
    expect(config.roundtable.configuredProviders).toEqual(['deepseek', 'glm', 'custom1']);
  });

  test('reads deployment abuse controls', () => {
    const config = loadConfig({
      DAILY_MEETING_LIMIT: '10',
      SESSION_MAX_AGE_HOURS: '2',
      SESSION_SECRET: 'session-secret',
    });

    expect(config.security.dailyMeetingLimit).toBe(10);
    expect(config.security.sessionMaxAgeMs).toBe(2 * 60 * 60 * 1000);
    expect(config.security.sessionSecret).toBe('session-secret');
  });

  test('uses one provider pool when multiple providers are configured', () => {
    const config = loadConfig({
      OPENAI_API_KEY: 'openai-key',
      CLAUDE_API_KEY: 'claude-key',
      ROLE_PROVIDERS: 'li:claude,heng:openai',
    });

    expect(config.roundtable.configuredProviders).toEqual(['openai', 'claude']);
    expect(config.roundtable.roleProviders).toEqual({ li: 'claude', heng: 'openai' });
  });
});
