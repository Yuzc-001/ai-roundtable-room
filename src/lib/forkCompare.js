/**
 * 1.5.3 分叉对比 — 两场 Decision Packet diff
 */

function norm(s) {
  return String(s ?? '').trim();
}

function listDiff(left = [], right = [], keyFn) {
  const lset = new Set(left.map(keyFn));
  const rset = new Set(right.map(keyFn));
  return {
    onlyLeft: left.filter((x) => !rset.has(keyFn(x))),
    onlyRight: right.filter((x) => !lset.has(keyFn(x))),
    both: left.filter((x) => rset.has(keyFn(x))),
  };
}

export function meetingEntryToCompareSource(entry) {
  if (!entry) return null;
  const m = entry.meeting ?? {};
  return {
    decisionPacket: m.decisionPacket,
    workspace: m.workspace,
    vote: m.vote,
    fork: m.fork,
    title: entry.displayLabel || entry.topic || m.title,
    savedAt: entry.savedAt,
    id: entry.id,
  };
}

export function compareDecisionPackets(a, b) {
  const pktA = a?.decisionPacket;
  const pktB = b?.decisionPacket;
  if (!pktA && !pktB) return { hasPackets: false, ready: false };

  const selA = pktA?.selectedOption?.description ?? '';
  const selB = pktB?.selectedOption?.description ?? '';
  const sameSelection = norm(selA) === norm(selB) && norm(selA).length > 0;

  const actionsA = pktA?.actionItems ?? [];
  const actionsB = pktB?.actionItems ?? [];
  const actionDiff = listDiff(actionsA, actionsB, (x) => norm(x.action));

  const tensionsA = a?.workspace?.tensions ?? [];
  const tensionsB = b?.workspace?.tensions ?? [];
  const tensionDiff = listDiff(tensionsA, tensionsB, (t) => norm(t.description));

  const objectionsA = pktA?.residualObjections ?? [];
  const objectionsB = pktB?.residualObjections ?? [];
  const objectionDiff = listDiff(objectionsA, objectionsB, (o) => norm(o.objection));

  return {
    hasPackets: Boolean(pktA || pktB),
    ready: Boolean(pktA?.selectedOption && pktB?.selectedOption),
    sameSelection,
    selectionA: selA,
    selectionB: selB,
    rationaleA: pktA?.selectedOption?.rationale ?? '',
    rationaleB: pktB?.selectedOption?.rationale ?? '',
    confidenceA: pktA?.selectedOption?.confidence,
    confidenceB: pktB?.selectedOption?.confidence,
    actionDiff,
    tensionDiff,
    objectionDiff,
    voteSummaryA: a?.vote?.summary ?? '',
    voteSummaryB: b?.vote?.summary ?? '',
    labelA: a?.fork?.label || a?.title || '场次 A',
    labelB: b?.fork?.label || b?.title || '场次 B',
    savedAtA: a?.savedAt,
    savedAtB: b?.savedAt,
  };
}

/** 优先返回带 fork 关系的最近一对 */
export function suggestForkComparePair(meetings = []) {
  if (!meetings?.length) return null;
  for (let i = meetings.length - 1; i >= 0; i -= 1) {
    if (meetings[i].meeting?.fork && i > 0) {
      return [meetings[i - 1], meetings[i]];
    }
  }
  if (meetings.length >= 2) {
    return [meetings[meetings.length - 2], meetings[meetings.length - 1]];
  }
  return null;
}

export function formatMeetingOptionLabel(entry) {
  if (!entry) return '';
  const date = entry.savedAt ? new Date(entry.savedAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
  const fork = entry.meeting?.fork?.label;
  const title = (entry.displayLabel || entry.topic || '未命名').slice(0, 36);
  return fork ? `${title} · ${fork}` : `${title}${date ? ` · ${date}` : ''}`;
}