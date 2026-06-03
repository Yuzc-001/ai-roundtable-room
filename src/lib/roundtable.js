import { linkMeetingEntryToTask, migrateProject } from './deliberationTasks.js';

export { migrateProject } from './deliberationTasks.js';

export function getPresetRoster({ personas, preset }) {
  return [preset.moderator, ...preset.participants]
    .map((id) => personas[id])
    .filter(Boolean);
}

export function deriveLiveState({ roster, speakerId, reactions = {} }) {
  const state = {};
  roster.forEach((persona) => {
    if (persona.id === speakerId) state[persona.id] = 'speaking';
    else if (reactions[persona.id]) state[persona.id] = reactions[persona.id];
    else state[persona.id] = 'listening';
  });
  return state;
}

export function deriveMemory(history) {
  const memory = {};
  history.forEach((item) => {
    if (item.kind !== 'turn') return;
    if (item.stance) memory[item.speaker] = { ...memory[item.speaker], stance: item.stance };
    if (item.citations) memory[item.speaker] = { ...memory[item.speaker], citations: item.citations };
  });
  return memory;
}

export function buildMeetingPayload({ topic, presetId, contextNotes, roster }) {
  return {
    topic,
    presetId,
    context: contextNotes.join('\n'),
    personas: roster.map((persona) => ({
      id: persona.id,
      name: persona.name,
      title: persona.title,
      blurb: persona.blurb,
      background: persona.background,
      contract: persona.contract,
    })),
  };
}

function createEmptyMemory() {
  return {
    summaries: [],
    risks: [],
    actions: [],
    decisions: [],
    riskRegister: [],
    assumptions: [],
    disagreements: [],
    actionItems: [],
  };
}

function normalizeMemory(memory = {}) {
  return {
    ...createEmptyMemory(),
    ...memory,
  };
}

export function createDefaultProject({ id = 'default-project', name = '默认项目', now = new Date().toISOString() } = {}) {
  return {
    id,
    name,
    createdAt: now,
    updatedAt: now,
    memoryEnabled: true,
    meetings: [],
    tasks: [],
    activeTaskId: null,
    memory: createEmptyMemory(),
    pendingMemoryChanges: [],
    rejectedMemoryChanges: [],
  };
}

export function archiveProject(project, archivedAt = new Date().toISOString()) {
  return {
    ...project,
    archivedAt,
  };
}

export function restoreArchivedProject(project) {
  const { archivedAt, ...restored } = project;
  return restored;
}

export function buildProjectMemoryContext(project) {
  if (project?.memoryEnabled === false) return '';
  const memory = normalizeMemory(project?.memory);
  const summaries = [...(memory.summaries ?? []), ...(memory.decisions ?? [])]
    .slice(0, 3)
    .map((item) => item.text)
    .filter(Boolean)
    .join('；');
  const risks = [...(memory.riskRegister ?? []), ...(memory.risks ?? [])]
    .slice(0, 6)
    .map((item) => `${item.issue} -> ${item.mitigation}`)
    .filter(Boolean)
    .join('；');
  const actions = [...(memory.actionItems ?? []), ...(memory.actions ?? [])]
    .slice(0, 6)
    .map((item) => item.text)
    .filter(Boolean)
    .join('；');
  const disagreements = (memory.disagreements ?? [])
    .slice(0, 4)
    .map((item) => item.text)
    .filter(Boolean)
    .join('；');

  return [
    project?.name ? `项目：${project.name}` : '',
    summaries ? `历史结论：${summaries}` : '',
    risks ? `未闭合风险：${risks}` : '',
    disagreements ? `未解决分歧：${disagreements}` : '',
    actions ? `待办行动：${actions}` : '',
  ].filter(Boolean).join('\n');
}

function makeChangeId(entryId, type, index) {
  return `${entryId}-${type}-${index + 1}`;
}

function buildMemoryChanges(entry, savedAt) {
  const meeting = entry.meeting ?? {};
  const diff = meeting.memoryDiff ?? {};
  const changes = [];

  (diff.decisions ?? []).forEach((item, index) => {
    changes.push({
      id: makeChangeId(entry.id, 'decision', index),
      type: 'decision',
      text: item.text,
      reason: item.reason || meeting.decisionPacket?.selectedOption?.rationale || '',
      sourceMeetingId: entry.id,
      createdAt: savedAt,
    });
  });
  (diff.risks ?? meeting.risks ?? []).forEach((item, index) => {
    changes.push({
      id: makeChangeId(entry.id, 'risk', index),
      type: 'risk',
      issue: item.issue,
      mitigation: item.mitigation,
      sourceMeetingId: entry.id,
      createdAt: savedAt,
    });
  });
  (diff.assumptions ?? []).forEach((item, index) => {
    changes.push({
      id: makeChangeId(entry.id, 'assumption', index),
      type: 'assumption',
      text: item.text,
      validation: item.validation || '',
      sourceMeetingId: entry.id,
      createdAt: savedAt,
    });
  });
  (diff.disagreements ?? []).forEach((item, index) => {
    changes.push({
      id: makeChangeId(entry.id, 'disagreement', index),
      type: 'disagreement',
      text: item.text,
      status: item.status || 'open',
      sourceMeetingId: entry.id,
      createdAt: savedAt,
    });
  });
  (diff.actions ?? (meeting.actions ?? []).map((text) => ({ text }))).forEach((item, index) => {
    changes.push({
      id: makeChangeId(entry.id, 'action', index),
      type: 'action',
      text: item.text || item,
      owner: item.owner || '用户',
      sourceMeetingId: entry.id,
      createdAt: savedAt,
    });
  });

  return changes.filter((change) => change.text || change.issue);
}

export function updateProjectWithMeeting(project, entry, meta = {}) {
  const savedAt = entry.savedAt || new Date().toISOString();
  const enriched = {
    ...entry,
    savedAt,
    ...(meta.taskId ? { taskId: meta.taskId } : {}),
    ...(meta.scenarioId ? { scenarioId: meta.scenarioId } : {}),
  };
  const meetings = [enriched, ...(project.meetings ?? [])].slice(0, 12);
  let next = migrateProject({
    ...project,
    updatedAt: savedAt,
    meetings,
  });
  if (meta.taskId) {
    next = linkMeetingEntryToTask(next, meta.taskId, enriched.id);
  }
  if (project.memoryEnabled === false) {
    return next;
  }
  const changes = buildMemoryChanges(enriched, savedAt);

  return {
    ...next,
    memory: normalizeMemory(project.memory),
    pendingMemoryChanges: [...changes, ...(project.pendingMemoryChanges ?? [])].slice(0, 40),
  };
}

/**
 * 删除指定 id 的单条历史会议记录（用于右栏“会议历史”手动清理）
 * 保持与 updateProjectWithMeeting 一致的风格，纯函数、不可变更新。
 */
export function removeMeetingFromProject(project, meetingEntryId) {
  const meetings = (project.meetings ?? []).filter((m) => m.id !== meetingEntryId);
  return {
    ...project,
    updatedAt: new Date().toISOString(),
    meetings,
  };
}

/** Update user-facing label for a saved meeting (does not change generated title). */
export function updateMeetingDisplayLabel(project, meetingEntryId, displayLabel) {
  const label = String(displayLabel ?? '').trim().slice(0, 80);
  const meetings = (project.meetings ?? []).map((m) => (
    m.id === meetingEntryId ? { ...m, displayLabel: label || undefined } : m
  ));
  return {
    ...project,
    updatedAt: new Date().toISOString(),
    meetings,
  };
}

export function approveProjectMemoryChanges(project, changeIds = []) {
  const selectedIds = new Set(changeIds);
  const pending = project.pendingMemoryChanges ?? [];
  const approved = pending.filter((change) => selectedIds.size === 0 || selectedIds.has(change.id));
  const memory = normalizeMemory(project.memory);

  for (const change of approved) {
    if (change.type === 'decision') {
      const item = {
        text: change.text,
        reason: change.reason || '',
        sourceMeetingId: change.sourceMeetingId,
        status: 'active',
        createdAt: change.createdAt,
      };
      memory.summaries = [item, ...memory.summaries].slice(0, 8);
      memory.decisions = [item, ...memory.decisions].slice(0, 20);
    }
    if (change.type === 'risk') {
      const item = {
        issue: change.issue,
        mitigation: change.mitigation,
        sourceMeetingId: change.sourceMeetingId,
        status: 'open',
        createdAt: change.createdAt,
      };
      memory.risks = [item, ...memory.risks].slice(0, 16);
      memory.riskRegister = [item, ...memory.riskRegister].slice(0, 24);
    }
    if (change.type === 'assumption') {
      memory.assumptions = [{
        text: change.text,
        validation: change.validation || '',
        sourceMeetingId: change.sourceMeetingId,
        status: 'active',
        createdAt: change.createdAt,
      }, ...memory.assumptions].slice(0, 24);
    }
    if (change.type === 'disagreement') {
      memory.disagreements = [{
        text: change.text,
        status: change.status || 'open',
        sourceMeetingId: change.sourceMeetingId,
        createdAt: change.createdAt,
      }, ...memory.disagreements].slice(0, 24);
    }
    if (change.type === 'action') {
      const item = {
        text: change.text,
        owner: change.owner || '用户',
        sourceMeetingId: change.sourceMeetingId,
        status: 'open',
        createdAt: change.createdAt,
      };
      memory.actions = [item, ...memory.actions].slice(0, 16);
      memory.actionItems = [item, ...memory.actionItems].slice(0, 24);
    }
  }

  return {
    ...project,
    memory,
    pendingMemoryChanges: pending.filter((change) => !approved.includes(change)),
    updatedAt: new Date().toISOString(),
  };
}

export function rejectProjectMemoryChanges(project, changeIds = []) {
  const selectedIds = new Set(changeIds);
  const pending = project.pendingMemoryChanges ?? [];
  const rejectedAt = new Date().toISOString();
  const rejected = pending
    .filter((change) => selectedIds.size === 0 || selectedIds.has(change.id))
    .map((change) => ({ ...change, rejectedAt }));

  return {
    ...project,
    pendingMemoryChanges: pending.filter((change) => !rejected.some((item) => item.id === change.id)),
    rejectedMemoryChanges: [...rejected, ...(project.rejectedMemoryChanges ?? [])].slice(0, 40),
    updatedAt: rejected.length ? rejectedAt : project.updatedAt,
  };
}

export function makeContextNote({ text, mentions = [] }) {
  const clean = text.trim();
  if (!clean) return '';
  const mentionText = mentions.length ? `${mentions.map((item) => `@${item.name}`).join(' ')} ` : '';
  return `${mentionText}${clean}`;
}

export function deriveMeetingStats({ meeting, contextNotes }) {
  return {
    turns: meeting.turns.length,
    disagreements: meeting.turns.filter((turn) => turn.stance === 'against').length,
    risks: meeting.risks.length,
    actions: meeting.actions.length,
    notes: contextNotes.length,
  };
}

export function buildContinuationContext({ topic, meeting, personas, userNote = '' }) {
  const risks = (meeting.risks ?? [])
    .map((risk) => `${risk.issue} -> ${risk.mitigation}`)
    .join('；');
  const actions = (meeting.actions ?? []).join('；');
  const keyTurns = (meeting.turns ?? [])
    .slice(0, 4)
    .map((turn) => {
      const persona = personas[turn.speaker];
      return `${persona?.name || turn.speaker}：${turn.text}`;
    })
    .join('\n');

  return [
    '上一场会议摘要',
    `原议题：${topic}`,
    meeting.vote?.summary ? `结论：${meeting.vote.summary}` : '',
    risks ? `风险：${risks}` : '',
    actions ? `行动：${actions}` : '',
    keyTurns ? `关键发言：\n${keyTurns}` : '',
    userNote.trim() ? `用户追问：${userNote.trim()}` : '',
  ].filter(Boolean).join('\n');
}
