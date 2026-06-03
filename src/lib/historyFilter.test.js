import { describe, expect, test } from 'vitest';
import { filterMeetings, filterMeetingsByTask, getMeetingDisplayLabel } from './historyFilter.js';

const MEETINGS = [
  { id: '1', topic: '产品上线评审', meeting: { title: '上线评审' } },
  { id: '2', topic: '定价策略', meeting: { title: '商业判断纪要' } },
  { id: '3', topic: '技术债清理', meeting: { title: '架构复盘' } },
  { id: '4', topic: '合作条款', meeting: { title: '法务审议' } },
];

describe('filterMeetings', () => {
  test('returns all when query empty', () => {
    expect(filterMeetings(MEETINGS, '')).toHaveLength(4);
    expect(filterMeetings(MEETINGS, '   ')).toHaveLength(4);
  });

  test('filters by topic case-insensitively', () => {
    expect(filterMeetings(MEETINGS, '产品')).toHaveLength(1);
    expect(filterMeetings(MEETINGS, 'PRODUCT')).toHaveLength(0);
  });

  test('filters by meeting title', () => {
    expect(filterMeetings(MEETINGS, '法务')).toHaveLength(1);
    expect(filterMeetings(MEETINGS, '商业')).toHaveLength(1);
  });

  test('returns empty array when no match', () => {
    expect(filterMeetings(MEETINGS, '不存在的关键词')).toEqual([]);
  });

  test('handles null meetings', () => {
    expect(filterMeetings(null, 'x')).toEqual([]);
  });

  test('filters by displayLabel', () => {
    const withLabel = [{ id: 'x', displayLabel: 'Q2 战略会', topic: 'other', meeting: { title: 't' } }];
    expect(filterMeetings(withLabel, '战略')).toHaveLength(1);
  });
});

describe('filterMeetingsByTask', () => {
  test('filters by taskId', () => {
    const list = [
      { id: '1', taskId: 't1' },
      { id: '2', taskId: 't2' },
      { id: '3' },
    ];
    expect(filterMeetingsByTask(list, 't1')).toHaveLength(1);
    expect(filterMeetingsByTask(list, null)).toHaveLength(3);
  });
});

describe('getMeetingDisplayLabel', () => {
  test('prefers displayLabel', () => {
    expect(getMeetingDisplayLabel({ displayLabel: '备注', topic: '议题' })).toBe('备注');
  });
});