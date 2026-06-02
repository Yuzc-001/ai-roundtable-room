export function sanitizeDownloadName(name) {
  return String(name || 'AI圆桌会议纪要').replace(/[\\/:*?"<>|]/g, '-');
}

const SOURCE_LABELS = {
  demo: '示例会议',
  live: '真实生成',
};

const VOTE_LABELS = {
  yes: '同意',
  yes_with: '附条件同意',
  no: '反对',
  abstain: '弃权',
};

export function formatMeetingMarkdown({
  topic,
  meeting,
  personas,
  contextNotes = [],
  providerLabel = '',
  meetingSource = 'demo',
  generatedAt = new Date().toISOString(),
}) {
  const lines = [
    `# ${meeting.title}`,
    '',
    `议题：${topic}`,
    `生成来源：${SOURCE_LABELS[meetingSource] || meetingSource}`,
    providerLabel ? `模型：${providerLabel}` : '',
    `生成时间：${generatedAt}`,
    '',
  ].filter((line) => line !== '');

  if (contextNotes.length > 0) {
    lines.push('## 上下文');
    lines.push('');
    for (const note of contextNotes) lines.push(`- ${note}`);
    lines.push('');
  }

  lines.push('## 证据溯源说明');
  lines.push('');
  lines.push('- **fact / user_input**：仅当发言引用你提供的议题、上下文或附件中的可核对材料；无外链材料时，系统会自动将无源 citation 降级为推断。');
  lines.push('- **inference / assumption / opinion**：模型判断或立场，不构成已验证事实。');
  lines.push('- **project_memory**：来自你已批准入库的项目记忆。');
  lines.push('- 导出中的「引用」行若未带链接，表示该条未绑定用户材料 URL。');
  lines.push('');

  lines.push('## 发言');
  lines.push('');

  for (const turn of meeting.turns) {
    const persona = personas[turn.speaker];
    lines.push(`### ${persona?.name || turn.speaker}｜${persona?.title || ''}`);
    if (turn.act || turn.phase || turn.evidenceLabel || typeof turn.confidence === 'number') {
      lines.push(`认知动作：${turn.act || '未标注'}｜阶段：${turn.phase || '未标注'}｜证据：${turn.evidenceLabel || '未标注'}｜置信度：${typeof turn.confidence === 'number' ? `${Math.round(turn.confidence * 100)}%` : '未标注'}`);
      lines.push('');
    }
    lines.push(turn.text);
    if (turn.citations?.length > 0) {
      lines.push('');
      lines.push('引用：');
      for (const citation of turn.citations) {
        lines.push(citation.url ? `- [${citation.label}](${citation.url})` : `- ${citation.label}`);
      }
    }
    lines.push('');
  }

  lines.push('## 投票');
  lines.push('');
  lines.push(`**${meeting.vote.question}**`);
  lines.push('');
  for (const [id, result] of Object.entries(meeting.vote.results)) {
    const persona = personas[id];
    lines.push(`- ${persona?.name || id}：${VOTE_LABELS[result.vote] || result.vote}，${result.reason}`);
  }
  lines.push('');
  lines.push(meeting.vote.summary);
  lines.push('');

  if (meeting.decisionPacket) {
    const packet = meeting.decisionPacket;
    lines.push('## Decision Packet');
    lines.push('');
    lines.push(`决策类型：${packet.decisionType}`);
    lines.push(`选择：${packet.selectedOption.description}`);
    lines.push(`理由：${packet.selectedOption.rationale}`);
    lines.push(`置信度：${Math.round(packet.selectedOption.confidence * 100)}%`);
    lines.push('');
    lines.push('### 保留异议');
    for (const item of packet.residualObjections ?? []) {
      lines.push(`- ${item.objection}${item.addressedBy ? `；应对：${item.addressedBy}` : ''}`);
    }
    lines.push('');
    lines.push('### 少数意见');
    lines.push(packet.minorityReport?.position || '无');
    lines.push('');
    lines.push('### 重开条件');
    for (const item of packet.reopenConditions ?? []) {
      lines.push(`- ${item.condition}：${item.checkMechanism}`);
    }
    lines.push('');
  }

  if (meeting.workspace) {
    lines.push('## 分歧与证据');
    lines.push('');
    for (const tension of meeting.workspace.tensions ?? []) {
      lines.push(`- 分歧：${tension.description}（${tension.status}）`);
    }
    for (const evidence of meeting.workspace.evidencePool ?? []) {
      lines.push(`- 证据：${evidence.claim}｜${evidence.source}｜${evidence.verificationStatus}`);
    }
    lines.push('');
  }

  lines.push('## 风险与修复');
  lines.push('');
  for (const risk of meeting.risks) {
    lines.push(`- ${risk.issue}：${risk.mitigation}`);
  }
  lines.push('');
  lines.push('## 下一步');
  lines.push('');
  for (const action of meeting.actions) {
    lines.push(`- ${action}`);
  }
  lines.push('');
  return lines.join('\n');
}

/* ===================== HTML 导出（自包含，适合复盘审阅） ===================== */

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Minimal protocol allow-list for citations in self-contained exported HTML (prevents javascript:/data: XSS when file is shared)
function isSafeCitationUrl(u) {
  if (!u) return false;
  const s = String(u).trim().toLowerCase();
  return /^https?:\/\//.test(s);
}

export function formatMeetingHTML({
  topic,
  meeting,
  personas,
  contextNotes = [],
  providerLabel = '',
  meetingSource = 'demo',
  generatedAt = new Date().toISOString(),
}) {
  const srcLabel = SOURCE_LABELS[meetingSource] || meetingSource;
  const genTime = new Date(generatedAt).toLocaleString('zh-CN', { hour12: false });
  const title = escapeHtml(meeting.title || 'AI 圆桌会议纪要');
  const safeTopic = escapeHtml(topic || '');

  const ACT_LABELS = {
    CLAIM: '主张', EVIDENCE: '证据', OBJECTION: '异议', REFINE: '精炼',
    CONCEDE: '让步', RESERVE: '保留', ANALOGY: '类比', EMPATHY: '共情',
    PROBE: '探询', META: '元治理',
  };
  const ACT_COLORS = {
    CLAIM: '#A64036', EVIDENCE: '#2E4D44', OBJECTION: '#CF5B49', REFINE: '#5F8864',
    CONCEDE: '#7C6DAE', RESERVE: '#C97855', ANALOGY: '#B89245', EMPATHY: '#496FA7',
    PROBE: '#B38B4D', META: '#B38B4D',
  };
  const EVIDENCE_LABELS = {
    fact: '事实', inference: '推断', assumption: '假设', opinion: '观点',
    project_memory: '项目记忆', user_input: '用户输入',
  };
  const PHASE_LABELS = {
    Frame: '开场定调', Diverge: '观点发散', Surface: '分歧暴露',
    Examine: '深度质询', Converge: '共识收拢', Decide: '最终裁定',
  };

  const getPersona = (id) => personas?.[id] || { name: id, title: '', color: '#666666', softColor: '#f0f0f0' };

  // 构建发言卡片（带 phase 分割线）
  let turnsHtml = '';
  let lastPhase = '';
  (meeting.turns || []).forEach((turn) => {
    const p = getPersona(turn.speaker);
    const color = p.color || '#666666';
    const phase = turn.phase || '';
    if (phase && phase !== lastPhase) {
      turnsHtml += `<div class="phase-sep"><span class="phase-sep-label">${escapeHtml(PHASE_LABELS[phase] || phase)}</span></div>`;
      lastPhase = phase;
    }
    const act = turn.act || '';
    const actLabel = ACT_LABELS[act] || act;
    const actCol = ACT_COLORS[act] || '#666666';
    const evLabel = turn.evidenceLabel ? (EVIDENCE_LABELS[turn.evidenceLabel] || turn.evidenceLabel) : '';
    const confPct = typeof turn.confidence === 'number' ? `${Math.round(turn.confidence * 100)}%` : '';
    const prov = turn.providerName ? escapeHtml(turn.providerName) : '';
    const text = escapeHtml(turn.text || '');

    let citeHtml = '';
    if (turn.citations && turn.citations.length > 0) {
      citeHtml = turn.citations.map((c) => {
        const lab = escapeHtml(c.label || '');
        if (c.url && isSafeCitationUrl(c.url)) {
          return `<a href="${escapeHtml(c.url)}" target="_blank" rel="noopener noreferrer" class="cite-link" title="${lab}">${lab}</a>`;
        }
        return `<span class="cite-pill" title="${c.url ? '已禁用不安全协议（仅 http/https）' : ''}">${lab}</span>`;
      }).join('');
    }

    const cardHtml = `
<article class="turn-card" style="--role-color: ${color}">
  <div class="turn-head">
    <div class="role-name" style="background:${color}; color:#fff;">${escapeHtml(p.name)}</div>
    <div class="role-meta">${escapeHtml(p.title || '')}</div>
    <div class="tag-row">
      ${phase ? `<span class="tag phase-tag">${escapeHtml(PHASE_LABELS[phase] || phase)}</span>` : ''}
      ${act ? `<span class="tag act-tag" style="background:${actCol}15; color:${actCol}; border-color:${actCol}33;">${actLabel}</span>` : ''}
      ${evLabel ? `<span class="tag ev-tag">${escapeHtml(evLabel)}</span>` : ''}
      ${confPct ? `<span class="tag conf-tag">置信 ${confPct}</span>` : ''}
      ${prov ? `<span class="tag prov-tag">${prov}</span>` : ''}
    </div>
  </div>
  <div class="turn-body">${text}</div>
  ${citeHtml ? `<div class="cite-row">${citeHtml}</div>` : ''}
</article>`.trim();
    turnsHtml += cardHtml + '\n';
  });

  // 投票区
  let voteHtml = '';
  if (meeting.vote) {
    const v = meeting.vote;
    const yesCount = Object.values(v.results || {}).filter(r => r.vote === 'yes').length;
    const totalV = Object.keys(v.results || {}).length;
    const rate = totalV ? Math.round((yesCount / totalV) * 100) : 0;
    voteHtml = `
      <section id="vote" class="section">
        <h2>最终投票</h2>
        <div class="vote-card">
          <div class="vote-q">${escapeHtml(v.question || '')}</div>
          <div class="vote-rate">赞成率 ${rate}%（${yesCount}/${totalV}）</div>
          <div class="vote-list">
            ${Object.entries(v.results || {}).map(([id, res]) => {
              const p = getPersona(id);
              const label = VOTE_LABELS[res.vote] || res.vote;
              return `<div class="vote-item" style="--r:${p.color}"><span class="v-name">${escapeHtml(p.name)}</span><span class="v-vote ${res.vote}">${label}</span><span class="v-reason">${escapeHtml(res.reason || '')}</span></div>`;
            }).join('')}
          </div>
          <div class="vote-sum">${escapeHtml(v.summary || '')}</div>
        </div>
      </section>`;
  }

  // Decision Packet（最突出）
  let packetHtml = '';
  const pkt = meeting.decisionPacket;
  if (pkt) {
    const sel = pkt.selectedOption || {};
    const conf = typeof sel.confidence === 'number' ? Math.round(sel.confidence * 100) : 0;
    packetHtml = `
      <section id="packet" class="section hero">
        <h2>Decision Packet · 决策封装</h2>
        <div class="packet-card">
          <div class="packet-head">
            <span class="packet-type">${escapeHtml(pkt.decisionType || 'conditional')}</span>
            <div class="packet-conf"><span>置信度</span><b>${conf}%</b></div>
          </div>
          <h3 class="packet-title">${escapeHtml(sel.description || '')}</h3>
          <p class="packet-rationale">${escapeHtml(sel.rationale || '')}</p>

          ${pkt.alternativesConsidered && pkt.alternativesConsidered.length ? `
            <div class="pkt-sub"><h4>备选方案（未采纳）</h4>
              ${pkt.alternativesConsidered.map(a => `<div class="alt-item"><b>${escapeHtml(a.description)}</b><span>— ${escapeHtml(a.whyNotSelected || '')}</span></div>`).join('')}
            </div>` : ''}

          <div class="pkt-grid">
            <div class="pkt-col">
              <h4>保留异议</h4>
              ${(pkt.residualObjections || []).length ? (pkt.residualObjections || []).map(o => `<p>${escapeHtml(o.objection)}${o.addressedBy ? `（应对：${escapeHtml(o.addressedBy)}）` : ''}</p>`).join('') : '<p class="empty">无</p>'}
            </div>
            <div class="pkt-col">
              <h4>少数意见</h4>
              <p>${escapeHtml((() => { const m = pkt.minorityReport; return m?.position || (typeof m === 'string' ? m : '无'); })())}</p>
            </div>
            <div class="pkt-col">
              <h4>重开条件</h4>
              ${(pkt.reopenConditions || []).length ? (pkt.reopenConditions || []).map(r => `<p>${escapeHtml(r.condition)} — ${escapeHtml(r.checkMechanism)}</p>`).join('') : '<p class="empty">无</p>'}
            </div>
          </div>

          ${(pkt.actionItems || []).length ? `
            <div class="pkt-sub"><h4>行动项</h4>
              ${(pkt.actionItems || []).map(a => `<div class="action-item">• ${escapeHtml(a.action)} ${a.owner ? `(负责人：${escapeHtml(a.owner)})` : ''}</div>`).join('')}
            </div>` : ''}
        </div>
      </section>`;
  }

  // Workspace（结构化工作台）
  let wsHtml = '';
  const ws = meeting.workspace;
  if (ws) {
    const tens = ws.tensions || [];
    const qs = ws.openQuestions || [];
    const evs = ws.evidencePool || [];
    const opts = ws.candidateOptions || [];
    wsHtml = `
      <section id="workspace" class="section">
        <h2>Session Workspace · 实时审议状态</h2>
        <div class="ws-grid">
          <div class="ws-card"><h4>候选方案</h4>${opts.length ? opts.map(o => `<p>${escapeHtml(o.description)}</p>`).join('') : '<p class="empty">—</p>'}</div>
          <div class="ws-card"><h4>未解决分歧 <span class="count">${tens.filter(t => t.status !== 'resolved').length}</span></h4>
            ${tens.length ? tens.map(t => `<p class="${t.status}">${escapeHtml(t.description)} <small>(${escapeHtml(t.status)})</small></p>`).join('') : '<p class="empty">无开放分歧</p>'}
          </div>
          <div class="ws-card"><h4>开放问题</h4>${qs.length ? qs.map(q => `<p>${escapeHtml(q.question)}</p>`).join('') : '<p class="empty">无</p>'}</div>
          <div class="ws-card"><h4>证据池</h4>${evs.length ? evs.map(e => `<p>${escapeHtml(e.claim)} <small>｜${escapeHtml(e.source || '')}｜${escapeHtml(e.verificationStatus || '')}</small></p>`).join('') : '<p class="empty">暂无外部证据</p>'}</div>
        </div>
      </section>`;
  }

  // 风险
  let risksHtml = '';
  if (meeting.risks && meeting.risks.length) {
    risksHtml = `
      <section id="risks" class="section">
        <h2>风险与缓解</h2>
        <ul class="risk-list">${meeting.risks.map(r => `<li><strong>${escapeHtml(r.issue)}</strong>：${escapeHtml(r.mitigation)}</li>`).join('')}</ul>
      </section>`;
  }

  // 行动
  let actionsHtml = '';
  if (meeting.actions && meeting.actions.length) {
    actionsHtml = `
      <section id="actions" class="section">
        <h2>下一步行动</h2>
        <ul class="action-list">${meeting.actions.map(a => `<li>${escapeHtml(a)}</li>`).join('')}</ul>
      </section>`;
  }

  // 记忆沉淀（来自 governance slice）
  let memHtml = '';
  const mdiff = meeting.memoryDiff;
  if (mdiff) {
    const mk = (arr, key) => (arr || []).map(x => `<li>${escapeHtml(x[key] || x.text || JSON.stringify(x))}</li>`).join('');
    memHtml = `
      <section id="memory" class="section">
        <h2>本场沉淀的结构化记忆（已建议入库）</h2>
        <div class="mem-grid">
          <div><h4>决策</h4><ul>${mk(mdiff.decisions, 'text')}</ul></div>
          <div><h4>风险</h4><ul>${mk(mdiff.risks, 'issue')}</ul></div>
          <div><h4>假设</h4><ul>${mk(mdiff.assumptions, 'text')}</ul></div>
          <div><h4>分歧</h4><ul>${mk(mdiff.disagreements, 'text')}</ul></div>
          <div><h4>行动</h4><ul>${mk(mdiff.actions, 'text')}</ul></div>
        </div>
      </section>`;
  }

  // 上下文
  let ctxHtml = '';
  if (contextNotes && contextNotes.length) {
    ctxHtml = `<div class="ctx"><strong>上下文：</strong> ${contextNotes.map(c => escapeHtml(c)).join('；')}</div>`;
  }

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — AI 圆桌会议纪要</title>
<style>
  :root { --bg:#F8F9F2; --ink:#111814; --ink2:#3E4A45; --accent:#B38B4D; --line:#ddd; --card:#fff; }
  body.dark { --bg:#0D0F0E; --ink:#D1D9D4; --ink2:#A1ACA6; --card:#161A18; --line:#333; }
  * { box-sizing:border-box; }
  body { font-family: "Inter","PingFang SC",system-ui,-apple-system,sans-serif; background:var(--bg); color:var(--ink); line-height:1.7; margin:0; padding:0; }
  .wrap { max-width:980px; margin:0 auto; padding:32px 20px 80px; }
  header { border-bottom:2px solid var(--accent); padding-bottom:20px; margin-bottom:32px; }
  h1 { font-size:28px; margin:0 0 8px; letter-spacing:-0.02em; }
  .meta { font-size:13px; color:var(--ink2); display:flex; gap:16px; flex-wrap:wrap; }
  .meta span { white-space:nowrap; }
  nav { display:flex; gap:8px; margin:16px 0 32px; flex-wrap:wrap; }
  nav a { font-size:13px; padding:4px 10px; border:1px solid var(--line); border-radius:999px; text-decoration:none; color:var(--ink2); }
  nav a:hover { background:var(--accent); color:#fff; border-color:var(--accent); }
  .section { margin:48px 0 0; }
  .section h2 { font-size:18px; border-bottom:1px solid var(--line); padding-bottom:8px; margin-bottom:16px; color:var(--accent); }
  .hero h2 { color:#B38B4D; }
  .turn-card { border-left:5px solid var(--role-color); background:var(--card); padding:16px 20px; margin:14px 0; border-radius:8px; box-shadow:0 1px 3px rgba(0,0,0,0.04); }
  .turn-head { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:8px; }
  .role-name { font-weight:700; font-size:13px; padding:2px 9px; border-radius:4px; }
  .role-meta { font-size:12px; color:var(--ink2); }
  .tag-row { display:flex; gap:6px; flex-wrap:wrap; }
  .tag { font-size:11px; padding:1px 7px; border-radius:999px; border:1px solid #ddd; }
  .phase-sep { margin:22px 0 10px; font-size:12px; color:var(--ink2); display:flex; align-items:center; gap:8px; }
  .phase-sep::before { content:''; flex:1; height:1px; background:var(--line); }
  .phase-sep-label { font-weight:600; }
  .turn-body { font-size:15px; white-space:pre-wrap; }
  .cite-row { margin-top:10px; font-size:12px; display:flex; gap:6px; flex-wrap:wrap; }
  .cite-link, .cite-pill { background:#f4f4f0; padding:2px 7px; border-radius:4px; text-decoration:none; color:#3E4A45; }
  .ctx { font-size:13px; background:#f8f8f0; padding:10px 14px; border-radius:6px; margin:16px 0; }
  .vote-card { background:var(--card); border:1px solid var(--line); border-radius:10px; padding:18px; }
  .vote-q { font-weight:700; font-size:16px; }
  .vote-rate { font-size:12px; color:var(--accent); margin:4px 0 12px; }
  .vote-item { display:grid; grid-template-columns:1fr auto 2fr; gap:8px; padding:6px 0; border-top:1px dashed #eee; font-size:14px; }
  .v-name { font-weight:600; }
  .v-vote { font-size:12px; padding:0 6px; border-radius:3px; }
  .v-vote.yes { background:#e6f4e6; color:#2E4D44; }
  .packet-card { border:2px solid #B38B4D; border-radius:12px; padding:22px; background:linear-gradient(#fffef8,#fff); }
  body.dark .packet-card { background:#1a1f1b; }
  .packet-head { display:flex; justify-content:space-between; align-items:center; }
  .packet-type { font-size:12px; letter-spacing:1px; background:#B38B4D; color:#fff; padding:2px 10px; border-radius:999px; }
  .packet-conf { text-align:right; font-size:12px; }
  .packet-conf b { font-size:28px; line-height:1; display:block; color:#B38B4D; }
  .packet-title { font-size:19px; margin:12px 0 6px; }
  .packet-rationale { color:var(--ink2); }
  .pkt-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:16px; margin-top:18px; }
  .pkt-col h4 { font-size:12px; margin:0 0 6px; color:var(--accent); }
  .pkt-sub { margin-top:16px; font-size:13px; }
  .alt-item, .action-item { padding:4px 0; font-size:13px; }
  .ws-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:14px; }
  .ws-card { background:var(--card); border:1px solid var(--line); border-radius:8px; padding:14px; font-size:13px; }
  .ws-card h4 { font-size:12px; margin:0 0 8px; color:var(--ink2); display:flex; justify-content:space-between; }
  .count { background:#B38B4D; color:#fff; font-size:10px; padding:0 5px; border-radius:999px; }
  .empty { color:#888; font-style:italic; font-size:12px; }
  ul.risk-list, ul.action-list { padding-left:20px; }
  .mem-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px; font-size:13px; }
  .mem-grid ul { margin:4px 0 0; padding-left:16px; }
  .toolbar { position:sticky; top:0; background:var(--bg); z-index:10; padding:8px 0; border-bottom:1px solid var(--line); display:flex; gap:8px; flex-wrap:wrap; margin-bottom:20px; }
  .toolbar button { font-size:12px; padding:6px 12px; border:1px solid var(--line); background:var(--card); border-radius:6px; cursor:pointer; transition:all .2s; }
  .toolbar button:hover { background:var(--accent); color:#fff; border-color:var(--accent); }
  .toolbar button:focus-visible { outline:2px solid var(--accent); outline-offset:2px; }
  .toolbar button[data-active="true"] { background: var(--accent); color: #fff; border-color: var(--accent); }
  .footer { margin-top:60px; font-size:11px; color:#888; text-align:center; border-top:1px solid var(--line); padding-top:20px; }
  .cards-hidden .turn-card,
  .cards-hidden .ws-card,
  .cards-hidden .pkt-col { display: none !important; }

  /* 深色模式增强（边缘元素补全） */
  body.dark .cite-link, body.dark .cite-pill { background:#222; color:#A1ACA6; border-color:#444; }
  body.dark .vote-item { border-top-color:#333; }
  body.dark .ctx { background:#1a1f1b; color:#D1D9D4; }
  body.dark .tag { border-color:#444; background:#1a1f1b; color:#A1ACA6; }
  body.dark .empty, body.dark .empty-text { color:#75827D; }
  body.dark .ws-card { border-color:#333; }
  body.dark .turn-body, body.dark .packet-rationale, body.dark .pkt-col p { color:#D1D9D4; }

  /* 长内容防护（极长文本/无空格不溢出） */
  .turn-body, .bubble-text, .packet-rationale, .ws-card p, .mem-grid li { overflow-wrap: anywhere; word-break: break-word; }

  @media print {
    .toolbar, nav { display:none !important; }
    .turn-card, .packet-card { box-shadow:none; border:1px solid #ccc; }
    body { background:#fff; color:#000; }
    .cards-hidden .turn-card,
    .cards-hidden .ws-card,
    .cards-hidden .pkt-col { display: block !important; }
  }
</style>
</head>
<body>
<div class="wrap">
  <div class="toolbar">
    <button onclick="window.print()" title="打印或保存为PDF">🖨 打印 / 存 PDF</button>
    <button onclick="document.body.classList.toggle('dark')" title="切换深色护眼模式">🌙 切换深色</button>
    <button onclick="toggleAllCards(this)" title="隐藏或显示全部发言与工作台卡片（打印时自动恢复）" data-active="false">隐藏/显示全部卡片</button>
    <button onclick="copyKeyPoints()" title="一键复制议题 + 最终建议 + 行动项（简洁专业），适合直接发消息或进文档">一键复制核心结论</button>
  </div>

  <header>
    <h1>${title}</h1>
    <div class="meta">
      <span>议题：${safeTopic}</span>
      <span>来源：${escapeHtml(srcLabel)}</span>
      ${providerLabel ? `<span>模型：${escapeHtml(providerLabel)}</span>` : ''}
      <span>生成：${escapeHtml(genTime)}</span>
      <span style="color:#B38B4D">结构化审议 · 可复盘版</span>
    </div>
    ${ctxHtml}
  </header>

  <nav>
    <a href="#turns">发言</a>
    ${voteHtml ? '<a href="#vote">投票</a>' : ''}
    ${packetHtml ? '<a href="#packet">Decision Packet</a>' : ''}
    ${wsHtml ? '<a href="#workspace">工作台</a>' : ''}
    ${risksHtml ? '<a href="#risks">风险</a>' : ''}
    ${actionsHtml ? '<a href="#actions">行动</a>' : ''}
    ${memHtml ? '<a href="#memory">记忆沉淀</a>' : ''}
  </nav>

  <section id="turns" class="section">
    <h2>审议发言时间线（${(meeting.turns||[]).length} 轮）</h2>
    ${turnsHtml || '<p>（无发言记录）</p>'}
  </section>

  ${voteHtml}
  ${packetHtml}
  ${wsHtml}
  ${risksHtml}
  ${actionsHtml}
  ${memHtml}

  <div class="footer">
    本 HTML 由 AI 圆桌会议室引擎生成 · 自包含文件 · 可直接分享或打印<br>
    数据包含角色认知动作、阶段、证据标签、置信度、实时 Workspace 与 Decision Packet，适合深度复盘。
  </div>
</div>
<script>
  let cardsHidden = false;
  function toggleAllCards(btn) {
    cardsHidden = !cardsHidden;
    document.body.classList.toggle('cards-hidden', cardsHidden);
    if (btn) {
      btn.textContent = cardsHidden ? '显示全部卡片' : '隐藏/显示全部卡片';
      btn.dataset.active = cardsHidden ? 'true' : 'false';
    }
  }
  function copyKeyPoints() {
    // 消息友好版 + 智能条件渲染（与 App 内保持一致）
    const topicEl = document.querySelector('header .meta span');
    const topic = topicEl ? topicEl.innerText.replace('议题：', '').trim() : '未指定议题';

    const pktTitle = document.querySelector('#packet .packet-title')?.innerText || '';
    const pktRationale = document.querySelector('#packet .packet-rationale')?.innerText || '';
    const voteSum = document.querySelector('.vote-sum')?.innerText || '';

    const disagreementEls = document.querySelectorAll('#packet .residual-objections p, .tensions .tension-item');
    const disagreements = Array.from(disagreementEls).slice(0, 3).map(el => '- ' + el.innerText.trim());

    const actionEls = document.querySelectorAll('#packet .action-item, .action-list li');
    const topActions = Array.from(actionEls).slice(0, 3).map(el => '• ' + el.innerText.trim());

    let text = '议题：' + topic + '\n\n';
    text += '最终建议：' + pktTitle + '\n';
    if (pktRationale) text += '理由：' + pktRationale + '\n\n';
    if (voteSum) text += '投票结果：' + voteSum + '\n\n';
    if (disagreements.length > 0) {
      text += '主要分歧：\n' + disagreements.join('\n') + '\n\n';
    }
    if (topActions.length > 0) {
      text += '核心行动项：\n' + topActions.join('\n') + '\n\n';
    }
    text += '（完整复盘见本 HTML）';
    navigator.clipboard.writeText(text).then(() => {
      showCopySuccess('已复制 · 可直接发消息或进文档');
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
      showCopySuccess('已复制（兼容模式）');
    });
    function showCopySuccess(msg) {
      const old = document.getElementById('copy-toast');
      if (old) old.remove();

      const isDark = document.body.classList.contains('dark');
      const bg = isDark ? '#548C7E' : '#2E4D44';

      const t = document.createElement('div');
      t.id = 'copy-toast';
      Object.assign(t.style, {
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translate(-50%, 0)',
        background: bg,
        color: '#fff',
        padding: '10px 18px',
        borderRadius: '10px',
        font: '13px/1.4 system-ui',
        zIndex: '9999',
        boxShadow: '0 8px 24px rgba(0,0,0,.25)',
        whiteSpace: 'nowrap',
        transition: 'opacity .3s'
      });
      t.textContent = '✓ ' + msg;
      document.body.appendChild(t);

      setTimeout(() => {
        t.style.opacity = '0';
        setTimeout(() => t.remove(), 300);
      }, 2200);
    }
  }
  // 键盘 ESC 退出深色
  document.addEventListener('keydown', e => { if (e.key === 'Escape') document.body.classList.remove('dark'); });
  console.log('%c[Roundtable] HTML minutes ready for review', 'color:#888');
</script>
</body>
</html>`;

  return html;
}
