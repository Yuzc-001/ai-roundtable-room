import { createServer } from 'node:http';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createApp } from '../server/app.js';
import { loadConfig } from '../server/config.js';

const servers = [];

async function request(app, { method = 'GET', path = '/', body } = {}) {
  const server = createServer(app);
  servers.push(server);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map((s) => new Promise((r) => s.close(r))));
});

describe('golden path API', () => {
  test('health → meeting with evidence policy → refresh closure', async () => {
    const provider = {
      generate: vi.fn(async () => ({
        content: JSON.stringify({
          title: '黄金路径',
          turns: [
            { speaker: 'du', text: '开场', thinking: [], citations: [], stance: 'neutral', reactions: [] },
            {
              speaker: 'heng',
              text: '引用外部报告',
              act: 'EVIDENCE',
              phase: 'Surface',
              evidenceLabel: 'fact',
              thinking: [],
              citations: [{ label: '外链', url: 'https://evil.example/x' }],
              stance: 'neutral',
              reactions: [],
            },
            { speaker: 'zhuo', text: '主张', thinking: [], citations: [], stance: 'neutral', reactions: [] },
            { speaker: 'li', text: '风险', thinking: [], citations: [], stance: 'against', reactions: [] },
            { speaker: 'che', text: '共情', thinking: [], citations: [], stance: 'neutral', reactions: [] },
          ],
          vote: {
            question: '是否推进？',
            results: [
              { speaker: 'zhuo', vote: 'yes_with', reason: '可试' },
              { speaker: 'li', vote: 'no', reason: '风险' },
              { speaker: 'heng', vote: 'yes_with', reason: '证据不足' },
              { speaker: 'che', vote: 'yes_with', reason: '支持' },
            ],
            summary: '初始收束',
          },
          risks: [{ issue: '风险', mitigation: '缓解' }],
          actions: ['行动'],
        }),
      })),
    };

    const refreshClosure = vi.fn(async ({ meeting }) => ({
      ...meeting,
      vote: { ...meeting.vote, summary: '重算后收束' },
    }));

    const app = await createApp({
      config: loadConfig({ OPENAI_API_KEY: 'secret-key' }),
      attachClient: false,
      providerFactory: () => provider,
      refreshClosure,
    });

    const health = await request(app, { path: '/api/health' });
    expect(health.status).toBe(200);
    expect(health.body.aiConfigured).toBe(true);

    const created = await request(app, {
      method: 'POST',
      path: '/api/meetings',
      body: { topic: '短议题，无用户外链' },
    });
    expect(created.status).toBe(200);
    const evidenceTurn = created.body.turns.find((t) => t.speaker === 'heng');
    expect(evidenceTurn.evidenceLabel).toBe('inference');
    expect(evidenceTurn.citations?.[0]?.url).toBeUndefined();

    const refreshed = await request(app, {
      method: 'POST',
      path: '/api/meetings/refresh-closure',
      body: {
        topic: '短议题，无用户外链',
        meeting: created.body,
      },
    });
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.vote.summary).toBe('重算后收束');
    expect(refreshClosure).toHaveBeenCalled();
  });
});