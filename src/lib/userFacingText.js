/** 把模型泄漏的内部字段名 / workspace id 转成用户能读懂的中文 */

const INTERNAL_ID_FALLBACKS = [
  [/\btension-[a-z0-9_-]+\b/gi, '该核心分歧'],
  [/\bquestion-[a-z0-9_-]+\b/gi, '该待澄清问题'],
  [/\bevidence-[a-z0-9_-]+\b/gi, '相关证据'],
  [/\boption-[a-z0-9_-]+\b/gi, '该方案'],
  [/\btensor-biredx\b/gi, ''],
  [/\bopenQuestions\b/g, '开放问题'],
  [/\bworkspace\b/gi, '审议工作台'],
  [/\bevidencePool\b/g, '证据池'],
  [/\bcandidateOptions\b/g, '备选方案'],
];

export const PHASE_LABELS = {
  Frame: '开场定调',
  Diverge: '观点发散',
  Surface: '分歧暴露',
  Examine: '深度质询',
  Converge: '共识收拢',
  Decide: '最终裁定',
  Document: '纪要封装',
};

function clipLabel(text, max = 28) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 用 workspace 条目把 id 替换成简短中文摘要 */
export function buildWorkspaceLabelMap(workspace) {
  const map = new Map();
  for (const t of workspace?.tensions ?? []) {
    if (t?.id && t?.description) {
      map.set(String(t.id).toLowerCase(), clipLabel(t.description));
    }
  }
  for (const q of workspace?.openQuestions ?? []) {
    if (q?.id && q?.question) {
      const qText = String(q.question).replace(/^需跟进[：:]\s*/u, '');
      map.set(String(q.id).toLowerCase(), clipLabel(qText));
    }
  }
  for (const e of workspace?.evidencePool ?? []) {
    if (e?.id && e?.claim) {
      map.set(String(e.id).toLowerCase(), clipLabel(e.claim));
    }
  }
  return map;
}

/**
 * @param {string} text
 * @param {object} [workspace]
 * @returns {string}
 */
export function humanizeUserFacingText(text, workspace) {
  if (text == null) return '';
  let out = String(text);

  const labelMap = buildWorkspaceLabelMap(workspace);
  const ids = [...labelMap.keys()].sort((a, b) => b.length - a.length);
  for (const id of ids) {
    const label = labelMap.get(id);
    if (!label) continue;
    out = out.replace(new RegExp(`\\b${escapeRegExp(id)}\\b`, 'gi'), `「${label}」`);
  }

  for (const [pattern, replacement] of INTERNAL_ID_FALLBACKS) {
    out = out.replace(pattern, replacement);
  }

  out = out
    .replace(/多个\s*开放问题/g, '多个待澄清问题')
    .replace(/需跟进[：:]\s*/gu, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([，。；、])/g, '$1')
    .trim();

  return out;
}

export function formatPhaseLabel(phaseId) {
  if (!phaseId) return '';
  return PHASE_LABELS[phaseId] || phaseId;
}

export function humanizeWorkspaceField(text, workspace) {
  return humanizeUserFacingText(text, workspace);
}