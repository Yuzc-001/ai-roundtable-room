/**
 * Suggested follow-up prompts after a deliberation — from open questions & actions.
 * @param {object} meeting
 * @param {number} [limit]
 * @returns {string[]}
 */
export function buildContinueSuggestions(meeting, limit = 3) {
  const out = [];
  const seen = new Set();

  const push = (text) => {
    const t = String(text || '').trim();
    if (!t || seen.has(t) || out.length >= limit) return;
    seen.add(t);
    out.push(t.length > 120 ? `${t.slice(0, 117)}…` : t);
  };

  for (const q of meeting?.workspace?.openQuestions ?? []) {
    if (q?.question) push(`若只验证一点：${q.question}`);
  }
  for (const t of (meeting?.workspace?.tensions ?? []).filter((x) => x.status === 'open')) {
    if (t?.description) push(`围绕分歧继续：${t.description}`);
  }
  for (const item of meeting?.decisionPacket?.actionItems ?? []) {
    const label = item?.action || item?.text || item?.description;
    if (label) push(`行动项深化：${label} — 最小下一步是什么？`);
  }
  for (const r of meeting?.decisionPacket?.reopenConditions ?? []) {
    if (r?.condition) push(`若触发重开：${r.condition}`);
  }

  if (!out.length) {
    push('如果关键假设被证伪，最小验证路径是什么？');
    push('还有哪些反对意见未被充分回应？');
  }

  return out.slice(0, limit);
}