import { describe, expect, test } from 'vitest';
import { createDefaultProject } from './roundtable.js';
import {
  addTaskToProject,
  createDeliberationTask,
  getMeetingsForTask,
  linkMeetingEntryToTask,
  migrateProject,
} from './deliberationTasks.js';
import { updateProjectWithMeeting } from './roundtable.js';

describe('deliberationTasks', () => {
  test('migrateProject adds tasks and activeTaskId', () => {
    const p = migrateProject({ id: 'p1', name: 'P' });
    expect(p.tasks).toEqual([]);
    expect(p.activeTaskId).toBeNull();
  });

  test('meeting links to task via updateProjectWithMeeting', () => {
    let project = createDefaultProject();
    const task = createDeliberationTask({ title: '上线决策', goal: '首批用户' });
    project = addTaskToProject(project, task);
    const entry = { id: 1001, topic: '是否开放试用', meeting: { title: 't', turns: [] }, source: 'live' };
    project = updateProjectWithMeeting(project, entry, { taskId: task.id, scenarioId: 'builtin:product' });
    expect(project.meetings[0].taskId).toBe(task.id);
    const linked = getMeetingsForTask(project, task.id);
    expect(linked).toHaveLength(1);
    expect(linked[0].id).toBe(1001);
  });

  test('linkMeetingEntryToTask appends id once', () => {
    const task = createDeliberationTask({ title: 'T' });
    let p = addTaskToProject(createDefaultProject(), task);
    p = linkMeetingEntryToTask(p, task.id, 42);
    p = linkMeetingEntryToTask(p, task.id, 42);
    expect(p.tasks[0].meetingEntryIds).toEqual([42]);
  });
});