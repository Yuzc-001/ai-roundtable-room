/**
 * 1.4 认知议会 — 客户端辅助与审计导出
 */

export function buildCouncilPayloadExtras({
  intelligenceUrls = [],
  intelligenceSnippets = [],
  intelDocuments = [],
  intervention = {},
  forkFrom = null,
  councilEnabled = true,
  admissionOverride = false,
} = {}) {
  return {
    council: {
      enabled: councilEnabled,
    },
    ...(intelDocuments.length ? { intelDocuments } : {}),
    ...(admissionOverride ? { admissionOverride: true } : {}),
    ...(intelligenceUrls.length || intelligenceSnippets.length
      ? {
        intelligence: {
          urls: intelligenceUrls,
          snippets: intelligenceSnippets,
        },
      }
      : {}),
    ...(intervention?.constraints || intervention?.directive || intervention?.paused
      ? { intervention }
      : {}),
    ...(forkFrom ? { forkFrom } : {}),
  };
}

export function formatCouncilAuditMarkdown(meeting, { topic = '' } = {}) {
  const c = meeting?.council;
  if (!c?.audit) return '';

  const lines = [
    '# 认知议会审计页',
    '',
    `议题：${topic || meeting?.title || ''}`,
    `生成时间：${c.audit.generatedAt || ''}`,
    '',
    '## 三阶段',
    ...(c.audit.stages ?? []).map((s) => `- ${s.label}（${s.count} 步）`),
    '',
    '## 盲评排名（长度校正后）',
  ];

  for (const row of c.peerRanking ?? []) {
    lines.push(`- ${row.anonymousId} / ${row.speakerId ?? '—'}：${row.totalScore} 分`);
    for (const rev of row.reviews ?? []) {
      lines.push(`  - ${rev.reviewer}: ${rev.score} — ${rev.rationale}`);
    }
  }

  lines.push('', '## 谁挑战了谁');
  if ((c.challenges ?? []).length === 0) {
    lines.push('- （无显著排名差距挑战）');
  } else {
    for (const ch of c.challenges) {
      lines.push(`- ${ch.challenger} → ${ch.target}：${ch.issue}（分差 ${ch.scoreGap}）`);
    }
  }

  if (c.chairman) {
    lines.push('', '## 主席裁决', c.chairman.synthesis || '', '', c.chairman.decisionSummary || '');
  }

  return lines.join('\n');
}

export function formatCouncilAuditHtml(meeting, { topic = '' } = {}) {
  const md = formatCouncilAuditMarkdown(meeting, { topic });
  const body = md
    .split('\n')
    .map((line) => {
      if (line.startsWith('# ')) return `<h1>${line.slice(2)}</h1>`;
      if (line.startsWith('## ')) return `<h2>${line.slice(3)}</h2>`;
      if (line.startsWith('- ')) return `<li>${line.slice(2)}</li>`;
      if (!line.trim()) return '';
      return `<p>${line}</p>`;
    })
    .join('\n');
  return `<!DOCTYPE html><html lang="zh"><head><meta charset="utf-8"/><title>认知议会审计</title>
<style>body{font-family:system-ui,sans-serif;max-width:720px;margin:2rem auto;line-height:1.6}
h1{font-size:1.4rem}h2{font-size:1.1rem;margin-top:1.5rem}li{margin:.25rem 0}</style></head>
<body>${body}</body></html>`;
}