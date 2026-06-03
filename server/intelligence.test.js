import { describe, expect, test } from 'vitest';
import {
  ingestIntelligence,
  mergeIntelligenceIntoContext,
  seedWorkspaceEvidence,
} from './intelligence.js';

describe('ingestIntelligence', () => {
  test('ingests text snippets', async () => {
    const { items, errors } = await ingestIntelligence({
      snippets: [{ title: '调研', text: '用户更愿意为决策记录付费，而非聊天。' }],
    });
    expect(items).toHaveLength(1);
    expect(items[0].verificationStatus).toBe('verified');
    expect(errors).toHaveLength(0);
  });

  test('fetches url with mock', async () => {
    const fetchImpl = async () => ({
      ok: true,
      arrayBuffer: async () => new TextEncoder().encode(
        `<html><body>${'市场调研显示用户更愿意为可追溯的决策记录付费，而非单纯聊天。'.repeat(3)}</body></html>`,
      ).buffer,
    });
    const { items } = await ingestIntelligence(
      { urls: ['https://example.com/report'] },
      { fetchImpl },
    );
    expect(items[0].meta.url).toContain('example.com');
    expect(items[0].claim.length).toBeGreaterThan(5);
  });
});

describe('mergeIntelligenceIntoContext', () => {
  test('appends intel block', () => {
    const ctx = mergeIntelligenceIntoContext('议题背景', [
      { source: '网页：ex', claim: 'claim', meta: { excerpt: '正文' } },
    ]);
    expect(ctx).toContain('[用户情报材料]');
    expect(ctx).toContain('正文');
  });
});

describe('seedWorkspaceEvidence', () => {
  test('adds intel items to pool', () => {
    const pool = seedWorkspaceEvidence([], [
      { id: 'intel-1', claim: 'c', source: 's', verificationStatus: 'partial' },
    ]);
    expect(pool).toHaveLength(1);
  });
});