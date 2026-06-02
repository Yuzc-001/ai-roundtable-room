import { isSafeCitationUrl } from './minutes.js';

const EVIDENCE_LABELS = {
  fact: '事实',
  inference: '推断',
  assumption: '假设',
  opinion: '观点',
  project_memory: '项目记忆',
  user_input: '用户输入',
};

const ACT_LABELS = {
  CLAIM: '主张', EVIDENCE: '证据', OBJECTION: '异议', REFINE: '精炼',
  CONCEDE: '让步', RESERVE: '保留', ANALOGY: '类比', EMPATHY: '共情',
  PROBE: '探询', META: '元治理',
};

const PHASE_LABELS = {
  Frame: '开场定调', Diverge: '观点发散', Surface: '分歧暴露',
  Examine: '深度质询', Converge: '共识收拢', Decide: '最终裁定',
};

const VERIFICATION_CLASS = {
  verified: 'verified',
  partial: 'partial',
  assumption: 'assumption',
  contradicted: 'contradicted',
  unverified: 'unverified',
};

const VERIFICATION_LABELS = {
  verified: '已验证',
  partial: '部分验证',
  assumption: '假设',
  contradicted: '已反驳',
  unverified: '未验证',
};

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeVerificationClass(status) {
  return VERIFICATION_CLASS[status] || 'unknown';
}

function excerpt(text, max = 80) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

function formatCitations(citations) {
  if (!citations?.length) return '—';
  return citations.map((c) => {
    const label = c.label || '引用';
    if (c.url && isSafeCitationUrl(c.url)) {
      return `${label} (${c.url})`;
    }
    return label;
  }).join('；');
}

function formatCitationsHtml(citations) {
  if (!citations?.length) return '—';
  return citations.map((c) => {
    const lab = escapeHtml(c.label || '引用');
    if (c.url && isSafeCitationUrl(c.url)) {
      return `<a href="${escapeHtml(c.url)}" target="_blank" rel="noopener noreferrer">${lab}</a>`;
    }
    return `<span class="cite-inline">${lab}</span>`;
  }).join(' ');
}

/**
 * @param {object} meeting
 * @param {Record<string, { name?: string }>} [personas]
 */
export function buildEvidenceMatrixRows(meeting, personas = {}) {
  const rows = [];
  for (const turn of meeting?.turns ?? []) {
    const speaker = personas[turn.speaker]?.name || turn.speaker || '—';
    rows.push({
      kind: 'turn',
      speaker,
      phase: PHASE_LABELS[turn.phase] || turn.phase || '—',
      act: ACT_LABELS[turn.act] || turn.act || '—',
      evidenceLabel: EVIDENCE_LABELS[turn.evidenceLabel] || turn.evidenceLabel || '—',
      confidence: typeof turn.confidence === 'number' ? `${Math.round(turn.confidence * 100)}%` : '—',
      citations: formatCitations(turn.citations),
      citationsHtml: formatCitationsHtml(turn.citations),
      excerpt: excerpt(turn.text),
    });
  }
  for (const ev of meeting?.workspace?.evidencePool ?? []) {
    const source = ev.source || '—';
    rows.push({
      kind: 'pool',
      speaker: '证据池',
      phase: '—',
      act: '—',
      evidenceLabel: VERIFICATION_LABELS[ev.verificationStatus] || ev.verificationStatus || '—',
      confidence: '—',
      citations: source,
      citationsHtml: escapeHtml(source),
      excerpt: excerpt(ev.claim, 80),
      verificationClass: safeVerificationClass(ev.verificationStatus),
    });
  }
  return rows;
}

export function formatEvidenceMatrixMarkdown({ topic, meeting, personas, generatedAt = new Date().toISOString() }) {
  const rows = buildEvidenceMatrixRows(meeting, personas);
  const genTime = new Date(generatedAt).toLocaleString('zh-CN', { hour12: false });
  const lines = [
    '## 证据矩阵',
    '',
    `议题：${topic || '—'}`,
    `生成：${genTime}`,
    `共 ${rows.length} 条`,
    '',
    '| 来源 | 角色 | 阶段 | 动作 | 证据标签 | 置信度 | 引用 | 摘要 |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
  ];
  for (const row of rows) {
    const kind = row.kind === 'pool' ? '证据池' : '发言';
    lines.push(
      `| ${kind} | ${row.speaker} | ${row.phase} | ${row.act} | ${row.evidenceLabel} | ${row.confidence} | ${row.citations.replace(/\|/g, '\\|')} | ${row.excerpt.replace(/\|/g, '\\|')} |`,
    );
  }
  lines.push('');
  return lines.join('\n');
}

export function formatEvidenceMatrixHTML({ topic, meeting, personas, generatedAt = new Date().toISOString() }) {
  const rows = buildEvidenceMatrixRows(meeting, personas);
  const genTime = new Date(generatedAt).toLocaleString('zh-CN', { hour12: false });
  const safeTopic = escapeHtml(topic || '—');

  const tableRows = rows.map((row) => {
    const kind = row.kind === 'pool' ? '证据池' : '发言';
    const verClass = row.verificationClass ? ` class="ev-${row.verificationClass}"` : '';
    return `<tr>
      <td>${escapeHtml(kind)}</td>
      <td>${escapeHtml(row.speaker)}</td>
      <td>${escapeHtml(row.phase)}</td>
      <td>${escapeHtml(row.act)}</td>
      <td${verClass}>${escapeHtml(row.evidenceLabel)}</td>
      <td>${escapeHtml(row.confidence)}</td>
      <td>${row.citationsHtml}</td>
      <td>${escapeHtml(row.excerpt)}</td>
    </tr>`;
  }).join('\n');

  return `
<section id="evidence-matrix" class="evidence-matrix-section">
  <style>
    .evidence-matrix-section { margin: 48px 0 0; }
    .evidence-matrix-section h2 { font-size: 18px; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 12px; color: #B38B4D; }
    .evidence-matrix-meta { font-size: 13px; color: #3E4A45; margin-bottom: 16px; }
    .evidence-matrix-table { width: 100%; border-collapse: collapse; font-size: 12px; background: #fff; }
    .evidence-matrix-table th, .evidence-matrix-table td { border: 1px solid #e8e8e0; padding: 8px 10px; text-align: left; vertical-align: top; }
    .evidence-matrix-table th { background: #f4f4f0; font-weight: 600; }
    .evidence-matrix-table tr:nth-child(even) td { background: #fafaf6; }
    .evidence-matrix-table .cite-inline { color: #3E4A45; }
    .evidence-matrix-table a { color: #2E4D44; }
    .evidence-matrix-table .ev-verified { color: #2E4D44; }
    .evidence-matrix-table .ev-assumption { color: #B37D3A; }
    .evidence-matrix-table .ev-contradicted { color: #9B4B3F; }
    .evidence-matrix-table .ev-unknown { color: #666; }
  </style>
  <h2>证据矩阵 · Evidence Matrix</h2>
  <p class="evidence-matrix-meta">议题：${safeTopic} · 生成：${escapeHtml(genTime)} · 共 ${rows.length} 条（发言 + 证据池）</p>
  <table class="evidence-matrix-table">
    <thead>
      <tr>
        <th>来源</th><th>角色</th><th>阶段</th><th>动作</th><th>证据标签</th><th>置信度</th><th>引用</th><th>摘要</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows || '<tr><td colspan="8" class="empty">暂无证据记录</td></tr>'}
    </tbody>
  </table>
</section>`.trim();
}

/** Full HTML page for standalone export */
export function formatEvidenceMatrixExportPage(opts) {
  const section = formatEvidenceMatrixHTML(opts);
  const title = escapeHtml(opts.meeting?.title || '证据矩阵');
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — 证据矩阵</title>
<style>
  body { font-family: "Inter","PingFang SC",system-ui,sans-serif; background:#F8F9F2; color:#111814; margin:0; padding:24px; line-height:1.6; }
  .wrap { max-width: 1200px; margin: 0 auto; }
  h1 { font-size: 22px; margin: 0 0 20px; }
</style>
</head>
<body>
<div class="wrap">
  <h1>${title}</h1>
  ${section}
  <p style="font-size:11px;color:#888;margin-top:32px;">由 AI 圆桌会议室生成 · 证据矩阵导出</p>
</div>
</body>
</html>`;
}