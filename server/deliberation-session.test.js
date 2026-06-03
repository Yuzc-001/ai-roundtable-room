import { afterEach, describe, expect, test } from 'vitest';
import {
  clearDeliberationSessionsForTests,
  createDeliberationSession,
  getDeliberationSession,
  injectDeliberationSession,
  pauseDeliberationSession,
  advanceDeliberationSession,
} from './deliberation-session.js';

describe('deliberation session', () => {
  afterEach(() => clearDeliberationSessionsForTests());

  test('creates session with admission and intel step when docs present', () => {
    const doc = {
      id: 'd1',
      title: 'T',
      source: 'test',
      chunks: [{ id: 'c0', text: '合规预算风险' }],
    };
    const out = createDeliberationSession({
      provider: { configuredProviders: [] },
      topic: '如何在合规下分配预算并控制风险？',
      presetId: 'product',
      context: '',
      personas: [],
      intelDocuments: [doc],
      admissionOverride: true,
    });
    expect(out.sessionId).toBeTruthy();
    expect(out.intelHitCount).toBeGreaterThan(0);
    expect(out.steps.some((s) => s.id === 'intel')).toBe(true);
  });

  test('pause blocks advance', async () => {
    const out = createDeliberationSession({
      provider: { configuredProviders: [] },
      topic: '是否上线收费版本，如何权衡风险？',
      presetId: 'product',
      context: '',
      personas: [],
      admissionOverride: true,
    });
    pauseDeliberationSession(out.sessionId);
    const status = await advanceDeliberationSession(out.sessionId);
    expect(status.waiting).toBe('paused');
  });

  test('inject queues pending constraints', () => {
    const out = createDeliberationSession({
      provider: { configuredProviders: [] },
      topic: '是否上线收费版本？',
      presetId: 'product',
      context: '',
      personas: [],
      admissionOverride: true,
    });
    injectDeliberationSession(out.sessionId, { constraints: '必须考虑合规' });
    expect(getDeliberationSession(out.sessionId)?.pendingInjection?.constraints).toContain('合规');
  });
});