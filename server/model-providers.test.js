import { describe, expect, test, vi } from 'vitest';
import { createClaudeCompatibleProvider, createModelProvider, createOpenAICompatibleProvider } from './model-providers.js';
import { loadConfig } from './config.js';

describe('OpenAI-compatible provider', () => {
  test('uses chat completions JSON mode', async () => {
    const client = {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{ message: { content: '{"title":"会议"}' } }],
          }),
        },
      },
    };
    const provider = createOpenAICompatibleProvider({
      name: 'OpenAI 兼容',
      apiKey: 'secret',
      model: 'test-model',
      maxTokens: 1200,
    }, { client });

    const result = await provider.generate({ systemPrompt: '只输出 JSON', userPrompt: '{"topic":"测试"}' });

    expect(result).toEqual({
      content: '{"title":"会议"}',
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
    });
    expect(client.chat.completions.create).toHaveBeenCalledWith(expect.objectContaining({
      model: 'test-model',
      response_format: { type: 'json_object' },
      max_tokens: 1200,
    }));
  });

  test('accepts JSON text returned by a compatible gateway', async () => {
    const client = {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue(JSON.stringify({
            choices: [{ message: { content: '{"title":"会议"}' } }],
            usage: { prompt_tokens: 11, completion_tokens: 7, total_tokens: 18 },
          })),
        },
      },
    };
    const provider = createOpenAICompatibleProvider({
      name: 'OpenAI 兼容',
      apiKey: 'secret',
      model: 'test-model',
      maxTokens: 1200,
    }, { client });

    const result = await provider.generate({ systemPrompt: '只输出 JSON', userPrompt: '{"topic":"测试"}' });

    expect(result).toEqual({
      content: '{"title":"会议"}',
      usage: { inputTokens: 11, outputTokens: 7, totalTokens: 18 },
    });
  });
});

describe('model router', () => {
  test('creates one provider pool for any configured API ids', () => {
    const router = createModelProvider(loadConfig({
      AI_PROVIDERS: 'openai,deepseek,glm',
      OPENAI_API_KEY: 'openai-key',
      DEEPSEEK_API_KEY: 'deepseek-key',
      GLM_API_KEY: 'glm-key',
    }));

    expect(router.providerIds).toEqual(['openai', 'deepseek', 'glm']);
    expect(Object.keys(router.providers)).toEqual(['openai', 'deepseek', 'glm']);
  });
});

describe('Claude-compatible provider', () => {
  test('calls the Messages API shape', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: '{"title":"会议"}' }],
      }),
    });
    const provider = createClaudeCompatibleProvider({
      name: 'Claude 兼容',
      apiKey: 'secret',
      apiVersion: '2023-06-01',
      baseUrl: 'https://api.anthropic.com',
      model: 'claude-test',
      maxTokens: 1600,
    }, { fetchImpl });

    const result = await provider.generate({ systemPrompt: '只输出 JSON', userPrompt: '{"topic":"测试"}' });

    expect(result).toEqual({
      content: '{"title":"会议"}',
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
    });
    expect(fetchImpl).toHaveBeenCalledWith('https://api.anthropic.com/v1/messages', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'x-api-key': 'secret',
        'anthropic-version': '2023-06-01',
      }),
      body: expect.stringContaining('"model":"claude-test"'),
    }));
  });

  test('accepts a Claude base URL that already includes the messages path', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text: '{"title":"会议"}' }] }),
    });
    const provider = createClaudeCompatibleProvider({
      name: 'Claude 兼容',
      apiKey: 'secret',
      apiVersion: '2023-06-01',
      baseUrl: 'https://proxy.example.com/v1/messages',
      model: 'claude-test',
      maxTokens: 1600,
    }, { fetchImpl });

    await provider.generate({ systemPrompt: '只输出 JSON', userPrompt: '{"topic":"测试"}' });

    expect(fetchImpl).toHaveBeenCalledWith('https://proxy.example.com/v1/messages', expect.any(Object));
  });
});
