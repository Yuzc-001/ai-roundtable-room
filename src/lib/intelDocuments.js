/**
 * 1.5.2 项目情报库 — 文档与段落块（客户端 + 服务端共用逻辑）
 */

const MAX_DOCS = 24;
const MAX_CHUNKS_PER_DOC = 40;
const CHUNK_SIZE = 480;

export function makeIntelDocId() {
  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function chunkText(text, size = CHUNK_SIZE) {
  const clean = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  const chunks = [];
  for (let i = 0; i < clean.length; i += size) {
    chunks.push({
      id: `chunk-${i}`,
      text: clean.slice(i, i + size),
    });
  }
  return chunks.slice(0, MAX_CHUNKS_PER_DOC);
}

export function createIntelDocument({
  title = '未命名材料',
  text = '',
  source = '用户粘贴',
  url = null,
  now = new Date().toISOString(),
} = {}) {
  const body = String(text ?? '').trim();
  if (!body) throw new Error('材料正文不能为空');
  return {
    id: makeIntelDocId(),
    title: String(title).slice(0, 80),
    source: String(source).slice(0, 120),
    url: url || null,
    createdAt: now,
    updatedAt: now,
    chunks: chunkText(body),
    charCount: body.length,
  };
}

export function migrateProjectIntel(project) {
  if (!project || typeof project !== 'object') return project;
  return {
    ...project,
    intelDocuments: Array.isArray(project.intelDocuments) ? project.intelDocuments : [],
    selectedIntelDocIds: Array.isArray(project.selectedIntelDocIds)
      ? project.selectedIntelDocIds
      : [],
  };
}

export function addIntelDocumentToProject(project, doc) {
  const base = migrateProjectIntel(project);
  const docs = [doc, ...base.intelDocuments].slice(0, MAX_DOCS);
  return {
    ...base,
    intelDocuments: docs,
    selectedIntelDocIds: [...new Set([doc.id, ...base.selectedIntelDocIds])],
    updatedAt: new Date().toISOString(),
  };
}

export function removeIntelDocumentFromProject(project, docId) {
  const base = migrateProjectIntel(project);
  return {
    ...base,
    intelDocuments: base.intelDocuments.filter((d) => d.id !== docId),
    selectedIntelDocIds: base.selectedIntelDocIds.filter((id) => id !== docId),
    updatedAt: new Date().toISOString(),
  };
}

export function toggleIntelDocSelection(project, docId, selected) {
  const base = migrateProjectIntel(project);
  const set = new Set(base.selectedIntelDocIds);
  if (selected) set.add(docId);
  else set.delete(docId);
  return { ...base, selectedIntelDocIds: [...set] };
}

export function getSelectedIntelDocuments(project) {
  const base = migrateProjectIntel(project);
  const ids = new Set(base.selectedIntelDocIds);
  return base.intelDocuments.filter((d) => ids.has(d.id));
}