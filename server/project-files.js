import fs from 'node:fs/promises';
import path from 'node:path';

const PROJECT_FOLDER_NAME = 'roundtable-projects';

function safeFilePart(value, fallback = '未命名项目') {
  const text = String(value || fallback)
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
  return text || fallback;
}

function projectFileBase(project) {
  return `${safeFilePart(project?.name)}-${safeFilePart(project?.id || 'project', 'project')}`;
}

function projectMarkdown(project, status) {
  const memory = project?.memory ?? {};
  const meetings = Array.isArray(project?.meetings) ? project.meetings : [];
  const summaries = Array.isArray(memory.summaries) ? memory.summaries : [];
  const risks = Array.isArray(memory.risks) ? memory.risks : [];
  const actions = Array.isArray(memory.actions) ? memory.actions : [];

  return [
    `# ${project?.name || '未命名项目'}`,
    '',
    `ID: ${project?.id || ''}`,
    `状态: ${status}`,
    project?.createdAt ? `创建时间: ${project.createdAt}` : '',
    project?.updatedAt ? `更新时间: ${project.updatedAt}` : '',
    project?.archivedAt ? `归档时间: ${project.archivedAt}` : '',
    `项目记忆: ${project?.memoryEnabled === false ? '关闭' : '开启'}`,
    `会议数量: ${meetings.length}`,
    '',
    '## 项目记忆',
    summaries.length ? summaries.map((item) => `- 结论: ${item.text || ''}`).join('\n') : '- 暂无结论',
    risks.length ? risks.map((item) => `- 风险: ${item.issue || ''} -> ${item.mitigation || ''}`).join('\n') : '- 暂无风险',
    actions.length ? actions.map((item) => `- 行动: ${item.text || item || ''}`).join('\n') : '- 暂无行动',
    '',
    '## 会议记录',
    meetings.length
      ? meetings.map((item) => [
        `### ${item.meeting?.title || item.topic || '未命名会议'}`,
        item.topic ? `议题: ${item.topic}` : '',
        item.savedAt ? `保存时间: ${item.savedAt}` : '',
        item.meeting?.vote?.summary ? `结论: ${item.meeting.vote.summary}` : '',
      ].filter(Boolean).join('\n')).join('\n\n')
      : '暂无会议记录',
    '',
  ].filter((line) => line !== '').join('\n');
}

async function writeProjectFiles(dir, projects, status) {
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
  await Promise.all(projects.map(async (project) => {
    const base = projectFileBase(project);
    await fs.writeFile(path.join(dir, `${base}.json`), JSON.stringify(project, null, 2), 'utf8');
    await fs.writeFile(path.join(dir, `${base}.md`), projectMarkdown(project, status), 'utf8');
  }));
}

export async function saveProjectSnapshot({ rootDir, projects = [], archivedProjects = [] }) {
  const folder = path.join(rootDir, PROJECT_FOLDER_NAME);
  const activeList = Array.isArray(projects) ? projects : [];
  const archivedList = Array.isArray(archivedProjects) ? archivedProjects : [];

  // Best-effort full-replace snapshot (rm + mkdir + parallel writes).
  // **Accepted trade-off (final closure, post rereview-round-1)**: Unconditional destructive replace + no internal atomic rename / structured error return wrapper inside this module.
  // Rationale for local-first single-user model (no shared DB, single-process deploys, human-in-loop via MemoryReviewPanel):
  // - Mitigations already in place and documented: pendingMemoryChanges capped (40), memory lists capped (summaries 8, risks 16/24, etc.), explicit human approve gate before long-term persistence, 300ms debounced best-effort sync in App with now-improved console.warn logging + context, caller (app.js route) catches and returns 5xx.
  // - No observed breakage in 71+ tests + repeated full verification runs (including post-fix-round).
  // - Full atomic (temp dir + rename) or internal try/catch + structured return would be larger change than "smallest" and add complexity for a local durability path that is already best-effort by design (contrasts with the strong in-memory + localStorage + human gate primary paths).
  // - Architecture.md and strategic-decisions.md frame the entire project-memory system (roundtable-projects/ + App wiring) as "best-effort local audit trail alongside browser state" under the A (extreme local professional) path.
  // The comment + App logging improvement + architecture note make the assumption fully transparent. Future elevation of durability guarantees can revisit (see plan Task 5 deferred items).
  // See architecture.md (Data Flow + project-files module), plan Execution Complete (accepted trade-offs), and merged review Responses for Issue 4/5.
  // Errors bubble to caller for handling.
  await fs.mkdir(folder, { recursive: true });
  await Promise.all([
    fs.writeFile(path.join(folder, 'README.md'), [
      '# AI 圆桌项目本地文件夹',
      '',
      '这个文件夹由圆桌智库自动维护，用来让项目数据在本地有一个清楚的位置。',
      '',
      '- `active-projects.json`: 当前项目完整快照',
      '- `archived-projects.json`: 归档项目完整快照',
      '- `active/`: 每个当前项目的 JSON 与 Markdown',
      '- `archived/`: 每个归档项目的 JSON 与 Markdown',
      '',
    ].join('\n'), 'utf8'),
    fs.writeFile(path.join(folder, 'active-projects.json'), JSON.stringify(activeList, null, 2), 'utf8'),
    fs.writeFile(path.join(folder, 'archived-projects.json'), JSON.stringify(archivedList, null, 2), 'utf8'),
    writeProjectFiles(path.join(folder, 'active'), activeList, '当前项目'),
    writeProjectFiles(path.join(folder, 'archived'), archivedList, '已归档'),
  ]);

  return {
    folder,
    activeCount: activeList.length,
    archivedCount: archivedList.length,
  };
}
