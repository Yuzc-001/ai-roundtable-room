import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import { saveProjectSnapshot } from './project-files.js';

const createdDirs = [];

afterEach(async () => {
  await Promise.all(createdDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

async function tempRoot() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'roundtable-project-files-'));
  createdDirs.push(dir);
  return dir;
}

describe('project file storage', () => {
  test('writes active and archived project snapshots into a clear local folder', async () => {
    const rootDir = await tempRoot();
    const projects = [{
      id: 'project-1',
      name: 'AI 圆桌 MVP',
      meetings: [{ id: 1, topic: '是否公开试用？', meeting: { title: '公开评审' } }],
      memory: { summaries: [{ text: '先小范围公开。' }], risks: [], actions: [] },
    }];
    const archivedProjects = [{
      id: 'project-2',
      name: '旧项目',
      archivedAt: '2026-05-17T10:00:00.000Z',
      meetings: [],
      memory: { summaries: [], risks: [], actions: [] },
    }];

    const result = await saveProjectSnapshot({ rootDir, projects, archivedProjects });

    expect(result.folder).toBe(path.join(rootDir, 'roundtable-projects'));
    await expect(fs.readFile(path.join(result.folder, 'README.md'), 'utf8')).resolves.toContain('AI 圆桌项目本地文件夹');
    await expect(fs.readFile(path.join(result.folder, 'active-projects.json'), 'utf8')).resolves.toContain('AI 圆桌 MVP');
    await expect(fs.readFile(path.join(result.folder, 'archived-projects.json'), 'utf8')).resolves.toContain('旧项目');
    await expect(fs.readFile(path.join(result.folder, 'active', 'AI 圆桌 MVP-project-1.md'), 'utf8')).resolves.toContain('是否公开试用？');
    await expect(fs.readFile(path.join(result.folder, 'archived', '旧项目-project-2.json'), 'utf8')).resolves.toContain('archivedAt');
  });
});
