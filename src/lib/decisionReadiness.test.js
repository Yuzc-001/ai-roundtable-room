import { describe, expect, test } from 'vitest';
import { buildDecisionReadiness } from './decisionReadiness.js';

describe('buildDecisionReadiness', () => {
  test('blocks start when single-model topic without override', () => {
    const r = buildDecisionReadiness({
      topic: '什么是 OKR',
      health: { aiConfigured: true },
      admissionOverride: false,
    });
    expect(r.canStart).toBe(false);
    expect(r.requiresConfirm).toBe(true);
  });

  test('allows start with override', () => {
    const r = buildDecisionReadiness({
      topic: '什么是 OKR',
      health: { aiConfigured: true },
      admissionOverride: true,
    });
    expect(r.canStart).toBe(true);
  });

  test('boosts score when intel selected', () => {
    const base = buildDecisionReadiness({
      topic: '是否上线收费版本，风险与路径如何权衡？',
      health: { aiConfigured: true },
      intelSelectedCount: 0,
      scenarioName: '',
    });
    const withIntel = buildDecisionReadiness({
      topic: '是否上线收费版本，风险与路径如何权衡？',
      health: { aiConfigured: true },
      intelSelectedCount: 2,
      scenarioName: '',
    });
    expect(withIntel.checks.find((c) => c.id === 'intel')?.ok).toBe(true);
    expect(base.checks.find((c) => c.id === 'intel')?.ok).toBe(false);
  });
});