import { describe, expect, test } from 'vitest';
import { humanizeUserFacingText, formatPhaseLabel } from './userFacingText.js';

describe('humanizeUserFacingText', () => {
  const workspace = {
    tensions: [{
      id: 'tension-b1redx',
      description: '缺少面试具体问题与原始回答',
      status: 'open',
    }],
    openQuestions: [{
      id: 'question-tb26y0',
      question: '请补充一场面试的题目与你的回答要点',
    }],
  };

  test('replaces known tension id with description snippet', () => {
    const raw = '我先把 tension-b1redx 换一个未来求职视角。';
    const out = humanizeUserFacingText(raw, workspace);
    expect(out).not.toContain('tension-b1redx');
    expect(out).toContain('「缺少面试具体问题与原始回答」');
  });

  test('strips unknown internal ids', () => {
    const out = humanizeUserFacingText('注意到 tension-xyz99 尚未闭合', {});
    expect(out).not.toMatch(/tension-xyz99/i);
    expect(out).toContain('该核心分歧');
  });

  test('replaces workspace jargon', () => {
    const out = humanizeUserFacingText('你提供的workspace中，openQuestions均指向同一缺口', workspace);
    expect(out).not.toContain('workspace');
    expect(out).not.toContain('openQuestions');
    expect(out).toContain('审议工作台');
    expect(out).toContain('开放问题');
  });

  test('formatPhaseLabel maps English phase ids', () => {
    expect(formatPhaseLabel('Surface')).toBe('分歧暴露');
    expect(formatPhaseLabel('Frame')).toBe('开场定调');
  });
});