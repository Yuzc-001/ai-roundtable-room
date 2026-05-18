import { describe, expect, test } from 'vitest';
import {
  buildContinuationContext,
  buildMeetingPayload,
  deriveLiveState,
  deriveMeetingStats,
  deriveMemory,
  getPresetRoster,
  makeContextNote,
  buildProjectMemoryContext,
  createDefaultProject,
  archiveProject,
  restoreArchivedProject,
  updateProjectWithMeeting,
  approveProjectMemoryChanges,
  rejectProjectMemoryChanges,
} from './roundtable.js';

const personas = {
  du: { id: 'du', name: '渡' },
  li: { id: 'li', name: '砺' },
  che: { id: 'che', name: '澈' },
};

const preset = {
  moderator: 'du',
  participants: ['li', 'che'],
};

describe('roundtable helpers', () => {
  test('returns moderator followed by participants', () => {
    expect(getPresetRoster({ personas, preset }).map((persona) => persona.id)).toEqual(['du', 'li', 'che']);
  });

  test('derives live state from speaker and reactions', () => {
    const state = deriveLiveState({
      roster: getPresetRoster({ personas, preset }),
      speakerId: 'li',
      reactions: { che: 'agree' },
    });

    expect(state).toEqual({
      du: 'listening',
      li: 'speaking',
      che: 'agree',
    });
  });

  test('remembers latest stance and citations by speaker', () => {
    const memory = deriveMemory([
      { kind: 'turn', speaker: 'li', stance: 'against' },
      { kind: 'user', text: '补充' },
      { kind: 'turn', speaker: 'li', stance: 'neutral', citations: [{ label: 'A' }] },
    ]);

    expect(memory.li).toEqual({ stance: 'neutral', citations: [{ label: 'A' }] });
  });

  test('builds API payload from current UI state', () => {
    const payload = buildMeetingPayload({
      topic: '如何上线？',
      presetId: 'product',
      contextNotes: ['预算有限'],
      roster: getPresetRoster({ personas, preset }),
    });

    expect(payload.topic).toBe('如何上线？');
    expect(payload.context).toBe('预算有限');
    expect(payload.personas).toEqual([
      { id: 'du', name: '渡', title: undefined, blurb: undefined, background: undefined },
      { id: 'li', name: '砺', title: undefined, blurb: undefined, background: undefined },
      { id: 'che', name: '澈', title: undefined, blurb: undefined, background: undefined },
    ]);
  });

  test('builds context notes with optional mentions', () => {
    expect(makeContextNote({ text: '请找反例', mentions: [{ name: '砺' }] })).toBe('@砺 请找反例');
    expect(makeContextNote({ text: '收成行动', mentions: [] })).toBe('收成行动');
  });

  test('derives meeting stats users can scan after a session', () => {
    const stats = deriveMeetingStats({
      meeting: {
        turns: [
          { stance: 'for' },
          { stance: 'against' },
          { stance: 'neutral' },
        ],
        risks: [{ issue: '成本' }, { issue: '噪音' }],
        actions: ['访谈', '复盘'],
      },
      contextNotes: ['请找反例'],
    });

    expect(stats).toEqual({
      turns: 3,
      disagreements: 1,
      risks: 2,
      actions: 2,
      notes: 1,
    });
  });

  test('builds continuation context from the previous meeting and follow-up', () => {
    const context = buildContinuationContext({
      topic: '如何上线？',
      personas,
      userNote: '请重点比较成本和转化。',
      meeting: {
        vote: {
          summary: '建议先做小范围验证。',
        },
        turns: [
          { speaker: 'du', text: '先收束范围。' },
          { speaker: 'li', text: '成本会是主要风险。' },
        ],
        risks: [{ issue: '成本', mitigation: '限制轮次' }],
        actions: ['找 5 个真实用户试用'],
      },
    });

    expect(context).toContain('上一场会议摘要');
    expect(context).toContain('原议题：如何上线？');
    expect(context).toContain('结论：建议先做小范围验证。');
    expect(context).toContain('风险：成本 -> 限制轮次');
    expect(context).toContain('行动：找 5 个真实用户试用');
    expect(context).toContain('渡：先收束范围。');
    expect(context).toContain('用户追问：请重点比较成本和转化。');
  });

  test('builds project memory context from prior conclusions, risks, and actions', () => {
    const project = {
      name: 'AI 圆桌 MVP',
      memory: {
        summaries: [{ text: '先公开小范围试用。' }],
        risks: [{ issue: '等待太久', mitigation: '减少模型调用次数' }],
        actions: [{ text: '找 5 个真实用户试用' }],
      },
    };

    const context = buildProjectMemoryContext(project);

    expect(context).toContain('项目：AI 圆桌 MVP');
    expect(context).toContain('历史结论：先公开小范围试用。');
    expect(context).toContain('未闭合风险：等待太久 -> 减少模型调用次数');
    expect(context).toContain('待办行动：找 5 个真实用户试用');
  });

  test('skips project memory context when memory is disabled', () => {
    const project = {
      name: 'AI 圆桌 MVP',
      memoryEnabled: false,
      memory: {
        summaries: [{ text: '先公开小范围试用。' }],
        risks: [{ issue: '等待太久', mitigation: '减少模型调用次数' }],
        actions: [{ text: '找 5 个真实用户试用' }],
      },
    };

    expect(buildProjectMemoryContext(project)).toBe('');
  });

  test('stores meeting history and proposes memory changes for user approval', () => {
    const project = createDefaultProject({ id: 'project-1', name: 'AI 圆桌 MVP', now: '2026-05-17T10:00:00.000Z' });
    const entry = {
      id: 1,
      topic: '是否公开试用？',
      savedAt: '2026-05-17T10:10:00.000Z',
      meeting: {
        title: '公开试用评审',
        vote: { summary: '建议先小范围公开。' },
        risks: [{ issue: '质量不稳', mitigation: '限定入口' }],
        actions: ['发布内测链接'],
        decisionPacket: {
          decisionType: 'conditional',
          selectedOption: { description: '小范围公开', rationale: '风险可控', confidence: 0.7 },
          residualObjections: [{ objection: '质量不稳', raisedBy: 'li' }],
          minorityReport: { position: '不宜直接公开', rationale: '质量不稳', conditionsToReconsider: [] },
          reopenConditions: [{ condition: '投诉率升高', checkMechanism: '每日复盘' }],
        },
        memoryDiff: {
          decisions: [{ text: '建议先小范围公开。', reason: '风险可控' }],
          risks: [{ issue: '质量不稳', mitigation: '限定入口' }],
          assumptions: [{ text: '小范围用户可接受当前质量。', validation: '内测反馈' }],
          disagreements: [{ text: '是否直接公开仍有分歧。', status: 'open' }],
          actions: [{ text: '发布内测链接', owner: '用户' }],
        },
      },
    };

    const updated = updateProjectWithMeeting(project, entry);

    expect(updated.meetings).toEqual([entry]);
    expect(updated.memory.summaries).toEqual([]);
    expect(updated.pendingMemoryChanges).toHaveLength(5);
    expect(updated.pendingMemoryChanges[0]).toMatchObject({ type: 'decision', text: '建议先小范围公开。' });
  });

  test('promotes approved memory changes into project ledgers', () => {
    const project = {
      ...createDefaultProject({ id: 'project-1', name: 'AI 圆桌 MVP', now: '2026-05-17T10:00:00.000Z' }),
      pendingMemoryChanges: [
        { id: 'change-1', type: 'decision', text: '小范围公开。', reason: '风险可控', sourceMeetingId: 1, createdAt: '2026-05-17T10:10:00.000Z' },
        { id: 'change-2', type: 'risk', issue: '质量不稳', mitigation: '限定入口', sourceMeetingId: 1, createdAt: '2026-05-17T10:10:00.000Z' },
        { id: 'change-3', type: 'action', text: '发布内测链接', owner: '用户', sourceMeetingId: 1, createdAt: '2026-05-17T10:10:00.000Z' },
      ],
    };

    const approved = approveProjectMemoryChanges(project, ['change-1', 'change-2']);

    expect(approved.pendingMemoryChanges).toEqual([
      { id: 'change-3', type: 'action', text: '发布内测链接', owner: '用户', sourceMeetingId: 1, createdAt: '2026-05-17T10:10:00.000Z' },
    ]);
    expect(approved.memory.summaries[0].text).toBe('小范围公开。');
    expect(approved.memory.decisions[0]).toMatchObject({ text: '小范围公开。', status: 'active' });
    expect(approved.memory.riskRegister[0]).toMatchObject({ issue: '质量不稳', status: 'open' });
  });

  test('rejects pending memory changes without changing ledgers', () => {
    const project = {
      ...createDefaultProject({ id: 'project-1', name: 'AI 圆桌 MVP', now: '2026-05-17T10:00:00.000Z' }),
      pendingMemoryChanges: [
        { id: 'change-1', type: 'decision', text: '小范围公开。', sourceMeetingId: 1, createdAt: '2026-05-17T10:10:00.000Z' },
      ],
    };

    const rejected = rejectProjectMemoryChanges(project, ['change-1']);

    expect(rejected.pendingMemoryChanges).toEqual([]);
    expect(rejected.rejectedMemoryChanges[0]).toMatchObject({ id: 'change-1', rejectedAt: expect.any(String) });
    expect(rejected.memory.summaries).toEqual([]);
  });

  test('keeps meeting history but stops writing memory when project memory is disabled', () => {
    const project = {
      ...createDefaultProject({ id: 'project-1', name: 'AI 圆桌 MVP', now: '2026-05-17T10:00:00.000Z' }),
      memoryEnabled: false,
    };
    const entry = {
      id: 1,
      topic: '是否公开试用？',
      savedAt: '2026-05-17T10:10:00.000Z',
      meeting: {
        vote: { summary: '建议先小范围公开。' },
        risks: [{ issue: '质量不稳', mitigation: '限定入口' }],
        actions: ['发布内测链接'],
      },
    };

    const updated = updateProjectWithMeeting(project, entry);

    expect(updated.meetings).toEqual([entry]);
    expect(updated.memory).toEqual(project.memory);
  });

  test('archives a project without losing meetings or memory', () => {
    const project = createDefaultProject({ id: 'project-1', name: 'AI 圆桌 MVP', now: '2026-05-17T10:00:00.000Z' });
    const withData = {
      ...project,
      meetings: [{ id: 1, topic: '是否公开试用？' }],
      memory: {
        summaries: [{ text: '先小范围试用。' }],
        risks: [{ issue: '质量不稳', mitigation: '限定入口' }],
        actions: [{ text: '发布内测链接' }],
      },
    };

    const archived = archiveProject(withData, '2026-05-17T11:00:00.000Z');

    expect(archived.archivedAt).toBe('2026-05-17T11:00:00.000Z');
    expect(archived.meetings).toEqual(withData.meetings);
    expect(archived.memory).toEqual(withData.memory);
  });

  test('restores an archived project back to the active project shape', () => {
    const archived = {
      ...createDefaultProject({ id: 'project-1', name: 'AI 圆桌 MVP', now: '2026-05-17T10:00:00.000Z' }),
      archivedAt: '2026-05-17T11:00:00.000Z',
    };

    const restored = restoreArchivedProject(archived);

    expect(restored.archivedAt).toBeUndefined();
    expect(restored.id).toBe('project-1');
    expect(restored.name).toBe('AI 圆桌 MVP');
  });
});
