export const TASK_STATUS_LABELS = {
  active: '进行中',
  paused: '暂停',
  closed: '已收束',
};

export function migrateProject(project) {
  if (!project || typeof project !== 'object') return project;
  return {
    ...project,
    tasks: Array.isArray(project.tasks) ? project.tasks : [],
    activeTaskId: project.activeTaskId ?? null,
    intelDocuments: Array.isArray(project.intelDocuments) ? project.intelDocuments : [],
    selectedIntelDocIds: Array.isArray(project.selectedIntelDocIds)
      ? project.selectedIntelDocIds
      : [],
  };
}

export function createDeliberationTask({
  title,
  goal = '',
  scenarioId = null,
  status = 'active',
  now = new Date().toISOString(),
} = {}) {
  const trimmed = String(title || '').trim();
  if (!trimmed) throw new Error('任务标题不能为空');
  const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return {
    id,
    title: trimmed.slice(0, 80),
    goal: String(goal || '').trim().slice(0, 300),
    scenarioId: scenarioId || null,
    status: TASK_STATUS_LABELS[status] ? status : 'active',
    meetingEntryIds: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function addTaskToProject(project, task) {
  const base = migrateProject(project);
  return {
    ...base,
    tasks: [task, ...base.tasks].slice(0, 30),
    activeTaskId: task.id,
    updatedAt: task.updatedAt,
  };
}

export function setProjectActiveTask(project, taskId) {
  const base = migrateProject(project);
  if (taskId && !base.tasks.some((t) => t.id === taskId)) return base;
  return {
    ...base,
    activeTaskId: taskId,
    updatedAt: new Date().toISOString(),
  };
}

export function linkMeetingEntryToTask(project, taskId, entryId) {
  if (!taskId || !entryId) return migrateProject(project);
  const base = migrateProject(project);
  const tasks = base.tasks.map((t) => {
    if (t.id !== taskId) return t;
    const meetingEntryIds = t.meetingEntryIds.includes(entryId)
      ? t.meetingEntryIds
      : [...t.meetingEntryIds, entryId];
    return { ...t, meetingEntryIds, updatedAt: new Date().toISOString() };
  });
  return { ...base, tasks, updatedAt: new Date().toISOString() };
}

export function updateTaskInProject(project, taskId, patch) {
  const base = migrateProject(project);
  const tasks = base.tasks.map((t) => {
    if (t.id !== taskId) return t;
    const status = patch.status && TASK_STATUS_LABELS[patch.status] ? patch.status : t.status;
    return {
      ...t,
      ...patch,
      status,
      title: patch.title != null ? String(patch.title).trim().slice(0, 80) : t.title,
      goal: patch.goal != null ? String(patch.goal).trim().slice(0, 300) : t.goal,
      updatedAt: new Date().toISOString(),
    };
  });
  return { ...base, tasks, updatedAt: new Date().toISOString() };
}

export function removeTaskFromProject(project, taskId) {
  const base = migrateProject(project);
  return {
    ...base,
    tasks: base.tasks.filter((t) => t.id !== taskId),
    activeTaskId: base.activeTaskId === taskId ? null : base.activeTaskId,
    updatedAt: new Date().toISOString(),
  };
}

export function getTaskById(project, taskId) {
  return migrateProject(project).tasks.find((t) => t.id === taskId) || null;
}

export function getMeetingsForTask(project, taskId) {
  const task = getTaskById(project, taskId);
  if (!task) return [];
  const byId = new Map((project.meetings ?? []).map((m) => [m.id, m]));
  return task.meetingEntryIds.map((id) => byId.get(id)).filter(Boolean);
}

export function getUngroupedMeetings(project) {
  const taskEntryIds = new Set();
  migrateProject(project).tasks.forEach((t) => {
    t.meetingEntryIds.forEach((id) => taskEntryIds.add(id));
  });
  return (project.meetings ?? []).filter((m) => !m.taskId && !taskEntryIds.has(m.id));
}