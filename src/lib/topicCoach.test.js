import { describe, expect, test } from 'vitest';
import { assessTopic } from './topicCoach.js';

describe('assessTopic', () => {
  test('idle for empty input', () => {
    expect(assessTopic('').level).toBe('idle');
  });

  test('warns on lookup-style questions', () => {
    const r = assessTopic('什么是 OKR');
    expect(r.level).toBe('warn');
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  test('hints on short deliberation topics', () => {
    const r = assessTopic('要不要上线');
    expect(['hint', 'warn']).toContain(r.level);
    expect(r.tips.length + r.warnings.length).toBeGreaterThan(0);
  });

  test('ok on well-formed deliberation question', () => {
    const r = assessTopic(
      '在预算砍半的前提下，我们是否应该把 AI 圆桌开放给第一批真实用户？需要哪些证据门槛？',
    );
    expect(r.level).toBe('ok');
    expect(r.warnings).toHaveLength(0);
  });
});