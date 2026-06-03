import { describe, expect, test } from 'vitest';
import { MeetingResultSchema } from './meeting.js';
import { forkMeetingAtCheckpoint } from './meeting.js';

const base = MeetingResultSchema.parse({
  title: '分叉测试',
  turns: [
    { speaker: 'du', text: '开场' },
    { speaker: 'zhuo', text: '主张' },
    { speaker: 'li', text: '反对' },
  ],
  vote: { question: 'Q', results: {}, summary: 'S' },
  risks: [],
  actions: [],
  memoryDiff: { decisions: [], risks: [], assumptions: [], disagreements: [], actions: [] },
});

describe('forkMeetingAtCheckpoint', () => {
  test('keeps turns up to checkpoint', () => {
    const fork = forkMeetingAtCheckpoint(base, {
      turnIndex: 1,
      label: '假设 B',
      intervention: { constraints: '必须考虑合规' },
    });
    expect(fork.meeting.turns).toHaveLength(2);
    expect(fork.meeting.fork.label).toBe('假设 B');
    expect(fork.resumeContext).toContain('合规');
  });

  test('rejects invalid index', () => {
    expect(() => forkMeetingAtCheckpoint(base, { turnIndex: 9 })).toThrow('无效');
  });
});