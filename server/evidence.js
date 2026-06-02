/**
 * 证据可信度：发言级 citation / evidenceLabel 与用户材料对齐，防止无源“事实”。
 */

const LABEL_DOWNGRADE = {
  fact: 'inference',
  user_input: 'inference',
};

function normalizeUrl(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}`.replace(/\/$/, '');
  } catch {
    return String(url ?? '').trim();
  }
}

export function extractUserEvidenceAnchors({ topic = '', context = '' } = {}) {
  const blob = `${topic}\n${context}`.trim();
  const urls = new Set();
  for (const match of blob.matchAll(/https?:\/\/[^\s)\]>"]+/gi)) {
    urls.add(normalizeUrl(match[0]));
  }
  const hasFileContext = /\[文件上下文\]|PDF|上传|附件/i.test(blob);
  const hasUserMaterial = blob.length > 60 || urls.size > 0 || hasFileContext;
  return { urls, hasUserMaterial, hasFileContext };
}

function citationAllowed(citation, anchors) {
  if (!citation?.url) return true;
  if (!anchors.hasUserMaterial) return false;
  return anchors.urls.has(normalizeUrl(citation.url));
}

export function enforceTurnEvidence(turn, anchors) {
  const next = { ...turn };
  let citations = (turn.citations ?? []).map((c) => ({ ...c }));

  if (!anchors.hasUserMaterial) {
    citations = citations
      .filter((c) => c?.label)
      .map((c) => (c.url ? { label: c.label } : c));
    if (next.evidenceLabel === 'fact' || next.evidenceLabel === 'user_input') {
      next.evidenceLabel = LABEL_DOWNGRADE[next.evidenceLabel] || 'inference';
    }
  } else {
    citations = citations
      .map((c) => {
        if (!c?.url) return c?.label ? c : null;
        if (citationAllowed(c, anchors)) return c;
        return { label: `${c.label}（未在用户材料中出现，已作推断引用）` };
      })
      .filter(Boolean);
    if (next.evidenceLabel === 'fact' && !citations.some((c) => c.url)) {
      next.evidenceLabel = 'inference';
    }
  }

  if (next.evidenceLabel === 'project_memory' && !/\[项目记忆\]|项目记忆|已批准|memory/i.test(`${turn.text}`)) {
    next.evidenceLabel = 'inference';
  }

  next.citations = citations.slice(0, 3);
  return next;
}

export function enforceMeetingEvidence(meeting, input = {}) {
  const anchors = extractUserEvidenceAnchors({
    topic: input.topic ?? '',
    context: input.context ?? '',
  });
  return {
    ...meeting,
    turns: (meeting.turns ?? []).map((turn) => enforceTurnEvidence(turn, anchors)),
  };
}