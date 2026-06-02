import { useEffect, useState } from 'react';

export function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      {/* The Aperture of Insight */}
      <circle cx="12" cy="12" r="10" stroke="var(--line-strong)" strokeWidth="1" strokeDasharray="3 2" />
      <path d="M12 2C12 2 12 5 12 7" stroke="var(--moderator)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M12 22V17" stroke="var(--moderator)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M2 12H7" stroke="var(--moderator)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M22 12H17" stroke="var(--moderator)" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1.5" fill="var(--academy)" stroke="var(--moderator)" strokeWidth="0.5" />
    </svg>
  );
}

export function Avatar({ persona, size, onClick }) {
  if (!persona) return null;
  return (
    <div
      className={`avatar${size === 'lg' ? ' lg' : ''}`}
      onClick={onClick}
      style={{
        '--ai-color': persona.color,
        '--ai-soft': persona.softColor,
      }}
      title={`${persona.name} · ${persona.title}`}
    >
      {persona.name}
      {persona.isModerator && <span className="mod-mark">主</span>}
    </div>
  );
}

export function Stage({ allPersonas, speakerId, onSeatClick }) {
  const total = allPersonas.length;
  return (
    <div className="stage">
      <div className="stage-arc">
        {allPersonas.map((persona, index) => {
          const t = total === 1 ? 0.5 : index / (total - 1);
          const x = 5 + t * 90;
          const yOffset = Math.sin(t * Math.PI) * 40;
          const isSpeaker = persona.id === speakerId;
          return (
            <div
              key={persona.id}
              className="seat-pos"
              style={{
                left: `${x}%`,
                bottom: `${yOffset}px`
              }}
            >
              {/* 
                Seat is intentionally a <div> (not native <button>) to preserve the complex JS arc positioning,
                breathing animation, .avatar-wrap layering, persona color vars, and "克制正式" visual language
                required by the product design (see ui-redesign-proposal.md and Stage component history).
                Full native button conversion would require significant reflow/positioning changes and risk
                visual regression in Focus/Mobile/generating modes. Minimal safe a11y (role, tabIndex, aria, key handler) added.
              */}
              <div
                className="seat"
                data-state={isSpeaker ? 'speaking' : 'audience'}
                role="button"
                tabIndex={0}
                aria-label={`${persona.name} 席位${isSpeaker ? '（发言中）' : ''}`}
                onClick={() => onSeatClick?.(persona)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSeatClick?.(persona); } }}
                style={{
                  '--ai-color': persona.color,
                  '--ai-soft': persona.softColor,
                }}
              >
                <div className={`avatar-wrap ${isSpeaker ? 'active' : ''}`}>
                  <div className="avatar">
                    {persona.name}
                    {persona.isModerator && <span className="mod-mark">主</span>}
                  </div>
                </div>
                <div className="seat-name">{persona.name}</div>
              </div>            </div>
          );
        })}
      </div>
    </div>
  );
}

const ACT_LABELS = {
  CLAIM: '主张',
  EVIDENCE: '证据',
  OBJECTION: '异议',
  REFINE: '精炼',
  CONCEDE: '让步',
  RESERVE: '保留',
  ANALOGY: '类比',
  EMPATHY: '共情',
  PROBE: '探询',
  META: '元治理',
};

export const EVIDENCE_LABELS = {
  fact: '事实',
  inference: '推断',
  assumption: '假设',
  opinion: '观点',
  project_memory: '项目记忆',
  user_input: '用户输入',
};

export const EVIDENCE_TOOLTIPS = {
  fact: '可核对的事实陈述',
  inference: '由事实推导，尚未独立验证',
  assumption: '审议中的前提，待验证',
  opinion: '立场性判断，非客观事实',
  project_memory: '来自已批准的项目记忆',
  user_input: '来自你提供的议题或材料',
};

export function Bubble({ persona, text, isLive, citations, stance, isUser, isStreaming, act, phase, confidence, evidenceLabel, providerName, dimmed }) {
  if (isUser) {
    return (
      <div className="bubble user">
        <div className="bubble-meta">
          <span className="bubble-name">执行官 (你)</span>
        </div>
        <div className="bubble-text">{text}</div>
      </div>
    );
  }

  const stanceLabels = { for: '支持战略', against: '持审慎异议', neutral: '客观观察' };
  return (
    <div
      className={`bubble${isLive ? ' live' : ' past'}${dimmed ? ' bubble--dimmed' : ''}`}
      style={{
        '--ai-color': persona.color,
        '--ai-soft': persona.softColor,
      }}
    >
      <div className="bubble-meta">
        <div className="avatar" style={{ width: 36, height: 36, fontSize: 18, borderRadius: 10 }}>
          {persona.name}
        </div>
        <div className="bubble-name">{persona.name}</div>
        {stance && (
          <div className="bubble-stance" data-stance={stance}>{stanceLabels[stance]}</div>
        )}
      </div>
      {(act || phase || evidenceLabel || typeof confidence === 'number' || providerName) && (
        <div className="bubble-protocol">
          {phase && <span className="tag tag-phase">{phase}</span>}
          {act && <span className={`tag tag-act-${(act || '').toLowerCase()}`}>{ACT_LABELS[act] || act}</span>}
          {evidenceLabel && (
            <span
              className={`tag tag-evidence tag-evidence--${evidenceLabel}`}
              title={EVIDENCE_TOOLTIPS[evidenceLabel] || EVIDENCE_LABELS[evidenceLabel]}
            >
              {EVIDENCE_LABELS[evidenceLabel] || evidenceLabel}
            </span>
          )}
          {typeof confidence === 'number' && <span className="tag">置信度 {Math.round(confidence * 100)}%</span>}
          {providerName && <span className="tag">{providerName}</span>}
        </div>
      )}
      <div className="bubble-text">
        {text}
        {isStreaming && <span className="caret" />}
      </div>
      {citations?.length > 0 && (
        <div className="citations">
          {citations.map((cite, idx) => (
            <span key={idx} className="citation-pill">
              ↗ {cite.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function VoteCard({ vote, personas }) {
  const yes = Object.values(vote.results).filter((result) => result.vote === 'yes').length;
  const total = Object.keys(vote.results).length;
  return (
    <div className="vote-card">
      <div className="vote-head">
        <div className="vote-title">{vote.question}</div>
        <div className="vote-tag">赞成率 {total ? Math.round((yes / total) * 100) : 0}%</div>
      </div>
      <div className="vote-rows">
        {Object.entries(vote.results).map(([id, result]) => {
          const persona = personas[id];
          if (!persona) return null;
          return (
            <div key={id} className="vote-row" style={{ '--ai-color': persona.color }}>
              <div className="avatar" style={{ width: 28, height: 28, fontSize: 14, borderRadius: 8 }}>{persona.name}</div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{persona.name}</div>
              <div className="vote-pill" data-vote={result.vote}>
                {result.vote === 'yes' ? '● 赞成' : '○ 存疑'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>{result.reason}</div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--line)', fontStyle: 'italic', color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.7 }}>
        {vote.summary}
      </div>
    </div>
  );
}

function clipWorkspaceText(text, max = 200) {
  const clean = String(text || '').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max)}…`;
}

export function WorkspacePanel({ workspace, isCompact }) {
  if (!workspace) return null;
  const tensions = workspace.tensions ?? [];
  const openTensions = tensions.filter((item) => item.status === 'open');
  const questions = workspace.openQuestions ?? [];
  const evidence = workspace.evidencePool ?? [];

  if (isCompact) {
    return (
      <div className="workspace-mini">
        <div className="mini-stat"><span>分歧</span><b>{openTensions.length}</b></div>
        <div className="mini-stat"><span>开放问题</span><b>{questions.length}</b></div>
        <div className="mini-stat"><span>证据点</span><b>{evidence.length}</b></div>
      </div>
    );
  }

  return (
    <div className="structured-panel">
      <div className="structured-panel-head">
        <div className="panel-title-wrap">
          <span className="panel-icon">▤</span>
          <span>认知碰撞台 · Session Workspace</span>
        </div>
        <b>{openTensions.length} 个开放分歧</b>
      </div>
      <div className="structured-grid">
        <div className="workspace-section">
          <h4><span className="dot danger"></span> 未解决分歧</h4>
          {openTensions.length ? openTensions.slice(0, 5).map((item) => (
            <div key={item.id} className="workspace-item">
              <p title={item.description}>{clipWorkspaceText(item.description)}</p>
            </div>
          )) : <p className="empty-text">暂无开放中的核心分歧。</p>}
        </div>
        <div className="workspace-section">
          <h4><span className="dot warning"></span> 开放问题</h4>
          {questions.length ? questions.slice(0, 5).map((item) => (
            <div key={item.id} className="workspace-item">
              <p title={item.question}>{clipWorkspaceText(item.question)}</p>
            </div>
          )) : <p className="empty-text">暂无需要用户补充或裁决的问题。</p>}
        </div>
        <div className="workspace-section">
          <h4><span className="dot info"></span> 证据池</h4>
          {evidence.length ? evidence.slice(0, 5).map((item) => (
            <div key={item.id} className="workspace-item">
              <p title={item.claim}>{clipWorkspaceText(item.claim)}</p>
              <small className="evidence-source">{item.verificationStatus || '待核实'}</small>
            </div>
          )) : <p className="empty-text">本场尚未登记外部证据。</p>}
        </div>
      </div>
    </div>
  );
}

export const DELIBERATION_PHASES = [
  {
    id: 'Frame',
    label: '开场定调',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
  },
  {
    id: 'Diverge',
    label: '观点发散',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="m15 15 6 6m-6-6v6m0-6h6M9 9 3 3m6 6V3m0 6H3" />
      </svg>
    ),
  },
  {
    id: 'Surface',
    label: '分歧暴露',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 13-1 1-1-1 1-1 1 1Z" fill="currentColor" />
        <path d="m12 8 1 1v2l-1 1-1-1V9l1-1Z" />
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
  },
  {
    id: 'Examine',
    label: '深度质询',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2 2 12l10 10 10-10L12 2z" />
      </svg>
    ),
  },
  {
    id: 'Converge',
    label: '共识收拢',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21 21-6-6m6 6v-6m0 6h-6M3 3l6 6m-6-6v6m0-6h6" />
      </svg>
    ),
  },
  {
    id: 'Decide',
    label: '最终裁定',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="4" fill="currentColor" />
      </svg>
    ),
  },
];

export function ModeratorConsole({ phase, status, onAction, generating = false }) {
  const phases = DELIBERATION_PHASES;

  const currentPhaseIdx = phases.findIndex(p => p.id === phase);

  return (
    <div className="moderator-console" data-generating={generating ? 'true' : undefined}>
      <div className="console-head">
        <span className="console-label">主持协议 · INTERVENTION</span>
        <div className="status-badge" data-busy={status === 'generating'}>
          {status === 'generating' ? '生成中...' : '待命'}
        </div>
      </div>

      <div className="phase-stepper">
        {phases.map((p, idx) => (
          <div
            key={p.id}
            className={`phase-step ${idx <= currentPhaseIdx ? 'active' : ''} ${idx === currentPhaseIdx ? 'current' : ''}`}
            title={p.label}
          >
            <span className="step-icon">{p.icon}</span>
            <span className="step-label">{p.label}</span>
          </div>
        ))}
      </div>

      {!generating && (
        <div className="console-actions">
          <button className="btn btn-subtle console-btn" onClick={() => onAction?.('probe')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            补缺口
          </button>
          <button className="btn btn-subtle console-btn" onClick={() => onAction?.('summarize')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 6h18M3 12h18M3 18h12" />
            </svg>
            收束判断
          </button>
          <button className="btn btn-subtle console-btn" onClick={() => onAction?.('tensions')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m17 5 5 5-5 5" />
              <path d="m7 19-5-5 5-5" />
              <path d="M2 14h20" />
            </svg>
            处理分歧
          </button>
        </div>
      )}
    </div>
  );
}

export function DecisionPacketCard({ packet }) {
  if (!packet) return null;
  return (
    <div className="decision-packet">
      <div className="decision-head">
        <span>Decision Packet · 下一步选择</span>
        <b>{packet.decisionType}</b>
      </div>
      <h3>{packet.selectedOption.description}</h3>
      <p>{packet.selectedOption.rationale}</p>
      <div className="decision-confidence">
        <span>置信度</span>
        <b>{Math.round(packet.selectedOption.confidence * 100)}%</b>
      </div>
      <div className="decision-section">
        <h4>保留异议 / 需要用户裁决</h4>
        {(packet.residualObjections ?? []).length ? packet.residualObjections.map((item, index) => (
          <p key={index}>{item.objection}{item.addressedBy ? ` / 应对：${item.addressedBy}` : ''}</p>
        )) : <p>无保留异议。</p>}
      </div>
      <div className="decision-section">
        <h4>少数意见</h4>
        <p>{packet.minorityReport?.position || '无少数意见。'}</p>
      </div>
      <div className="decision-section">
        <h4>重开条件 / 继续深挖触发器</h4>
        {(packet.reopenConditions ?? []).length ? packet.reopenConditions.map((item, index) => (
          <p key={index}>{item.condition} / {item.checkMechanism}</p>
        )) : <p>暂无重开条件。</p>}
      </div>
    </div>
  );
}

const CHANGE_LABELS = {
  decision: '决策',
  risk: '风险',
  assumption: '假设',
  disagreement: '分歧',
  action: '行动',
};

export function MemoryReviewPanel({ changes = [], onApprove, onReject }) {
  if (!changes.length) return null;
  return (
    <div className="memory-review">
      <div className="memory-review-head">
        <span>项目记忆审批</span>
        <b>{changes.length}</b>
      </div>
      <div style={{fontSize:'11px', color:'var(--ink-3)', marginBottom:'12px', lineHeight:1.4}}>批准后这些判断将成为未来审议的认知资产，减少重复探索（核心价值闭环）</div>
      {changes.slice(0, 8).map((change) => (
        <div key={change.id} className="memory-change">
          <small>{CHANGE_LABELS[change.type] || change.type}</small>
          <p>{change.text || change.issue}</p>
          {change.mitigation && <em>{change.mitigation}</em>}
          <div className="memory-change-actions">
            <button className="btn btn-ghost" onClick={() => onReject([change.id])}>暂不入库</button>
            <button className="btn btn-primary" onClick={() => onApprove([change.id])}>确认入库此判断</button>
          </div>
        </div>
      ))}
      {changes.length > 1 && (
        <div className="memory-review-actions">
          <button className="btn btn-ghost" onClick={() => onReject(changes.map((item) => item.id))}>全部暂不入库</button>
          <button className="btn btn-primary" onClick={() => onApprove(changes.map((item) => item.id))}>全部确认入库</button>
        </div>
      )}
    </div>
  );
}

export function PersonaDrawer({ persona, onSave, onClose, onReset }) {
  const [draft, setDraft] = useState(persona);
  useEffect(() => { setDraft(persona); }, [persona?.id]);
  if (!persona) return null;
  const colorOptions = ['#1E293B', '#CF5B49', '#496FA7', '#5F8864', '#7C6DAE', '#C97855', '#B89245', '#4B928C'];

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 200 }} onClick={onClose} />
      <div className="drawer">
        <div className="drawer-head">
          <div className="avatar lg" style={{ '--ai-color': draft.color }}>{draft.name}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>档案：{draft.name}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>此配置将同步至机要处</div>
          </div>
          <button className="btn btn-subtle" onClick={onClose} style={{ fontSize: 24, opacity: 0.4 }}>✕</button>
        </div>
        <div className="drawer-body">
          <div className="field">
            <label className="field-label">官衔姓名</label>
            <input className="input field-input" value={draft.name} maxLength={4}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <div className="field">
            <label className="field-label">专业领域</label>
            <input className="input field-input" value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </div>
          <div className="field">
            <label className="field-label">战略背景</label>
            <textarea className="textarea field-textarea" value={draft.background || ''} rows={5}
              onChange={(e) => setDraft({ ...draft, background: e.target.value })}
              placeholder="例：宏观经济学泰斗，专注于非对称风险分析..." />
          </div>
          <div className="field">
            <label className="field-label">勋章色调</label>
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              {colorOptions.map((color) => (
                <button
                  type="button"
                  key={color}
                  aria-label={`选择颜色 ${color}`}
                  onClick={() => setDraft({ ...draft, color })}
                  style={{
                    width: 28, height: 28, borderRadius: 8, background: color, cursor: 'pointer', padding: 0,
                    border: draft.color === color ? '2.5px solid var(--moderator)' : '1px solid var(--line)',
                    boxShadow: draft.color === color ? '0 0 12px rgba(181, 148, 16, 0.4)' : 'none'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="drawer-foot">
          <button className="btn btn-ghost" onClick={onReset}>恢复初始</button>
          <button className="btn btn-primary" onClick={() => { onSave(draft); onClose(); }}>保存档案</button>
        </div>
      </div>
    </>
  );
}

export function SetupGuidePanel({ snippet, steps, onCopied }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(snippet);
        setCopied(true);
        onCopied?.();
        setTimeout(() => setCopied(false), 2400);
      }
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="setup-guide" aria-label="首次配置引导">
      <div className="setup-guide-head">
        <b>配置 API Key 以启用真实审议</b>
        <span>演示模式可浏览流程，填写 .env 后重启服务即可生成。</span>
      </div>
      <ol className="setup-guide-steps">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <pre className="setup-guide-snippet">{snippet}</pre>
      <div className="setup-guide-actions">
        <button type="button" className={`btn btn-primary${copied ? ' export-success' : ''}`} onClick={handleCopy}>
          {copied ? '已复制到剪贴板' : '复制最小 .env 配置'}
        </button>
        <code className="setup-guide-hint">npm run doctor</code>
      </div>
    </section>
  );
}

export function ContinueDeliberationPanel({ value, onChange, onSubmit, disabled }) {
  return (
    <section className="continue-panel" aria-label="基于本场继续追问">
      <div className="continue-panel-head">
        <b>继续追问</b>
        <span>系统会把上一场结论、风险与关键发言注入下一场审议。</span>
      </div>
      <textarea
        className="textarea continue-panel-input"
        rows={2}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="例如：如果预算砍半，最小验证路径是什么？"
        disabled={disabled}
      />
      <button type="button" className="btn btn-primary" onClick={onSubmit} disabled={disabled}>
        基于此发起追问审议
      </button>
    </section>
  );
}
