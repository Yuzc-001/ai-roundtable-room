import { describe, expect, test } from 'vitest';
import { assessTopicAdmission } from './topicAdmission.js';

describe('assessTopicAdmission', () => {
  test('flags fact-query as single model', () => {
    const r = assessTopicAdmission('什么是 OKR');
    expect(r.fit).toBe('single_model_better');
    expect(r.requiresConfirm).toBe(true);
  });

  test('recommends roundtable for decision tension', () => {
    const r = assessTopicAdmission('我们是否应该在 Q3 投入 200 万做 AI 圆桌，风险与路径如何权衡？');
    expect(r.fit).toBe('roundtable_recommended');
    expect(r.suggestRoundtable).toBe(true);
  });

  test('override clears confirm', () => {
    const r = assessTopicAdmission('什么是 OKR', { forceRoundtable: true });
    expect(r.requiresConfirm).toBe(false);
  });
});