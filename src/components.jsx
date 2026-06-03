import { useEffect, useMemo, useState } from 'react';
import { Button, Chip } from './ui/index.js';
import { getVerifyStepContinueLabel } from './lib/healthCheck.js';
import { buildContinueSuggestions } from './lib/continueSuggestions.js';
import { formatDecisionTypeLabel } from './lib/minutes.js';
import { assessTopic } from './lib/topicCoach.js';
import { STANCE_FULL } from './lib/turnDisplay.js';
import { formatPhaseLabel, humanizeUserFacingText } from './lib/userFacingText.js';
import { Logo } from './components/Logo.jsx';
import { CognitiveCouncilPanel } from './components/session/CognitiveCouncilPanel.jsx';
export {
  DecisionReadinessPanel,
  IntelWorkbench,
  DeliberationConsole,
  ForkCompareWorkbench,
  DecisionSidebar,
} from './components/v15/index.js';

export { Logo };
export {
  SessionRoom,
  SessionChrome,
  SessionMinutes,
  SessionPresence,
  SessionClosure,
  MinuteEntry,
  WorkbenchDraft,
} from './components/session/index.js';

export function TopicCoach({ topic }) {
  const assessment = useMemo(() => assessTopic(topic), [topic]);
  if (assessment.level === 'idle') return null;
  const items = [...assessment.warnings, ...assessment.tips];
  return (
    <div
      className={`topic-coach topic-coach--${assessment.level}`}
      role="status"
      aria-live="polite"
    >
      <span className="topic-coach-count">{assessment.charCount} 字</span>
      <ul className="topic-coach-list">
        {items.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

export function TopicPreflightBar({
  topic,
  health,
  scenarioName,
  taskTitle,
  memoryEnabled,
  phaseCount = DELIBERATION_PHASES.length,
}) {
  const assessment = assessTopic(topic);
  const topicOk = assessment.level === 'ok' || (assessment.level === 'hint' && !assessment.warnings.length);
  const apiOk = health?.aiConfigured === true;
  if (!topic.trim()) return null;

  return (
    <div className="topic-preflight" role="region" aria-label="发起审议前检查">
      <span className="topic-preflight-title">发起前确认（都通过即可点「启动审议」）</span>
      <ul className="topic-preflight-checks">
        <li data-ok={topicOk ? 'true' : 'false'}>
          <span className="topic-preflight-mark" aria-hidden="true">{topicOk ? '✓' : '!'}</span>
          <span>{topicOk ? '议题已写清，可以开会' : '议题还偏空或太笼统，请看下方教练提示'}</span>
        </li>
        <li data-ok={apiOk ? 'true' : 'false'}>
          <span className="topic-preflight-mark" aria-hidden="true">{apiOk ? '✓' : '○'}</span>
          <span>{apiOk ? 'AI 模型已连接，可真实生成' : '当前为演示模式（未配置 API Key 也能先看流程）'}</span>
        </li>
        <li data-ok="true">
          <span className="topic-preflight-mark" aria-hidden="true">✓</span>
          <span>审议场景：{scenarioName || '未选'}</span>
        </li>
        {taskTitle ? (
          <li data-ok="true">
            <span className="topic-preflight-mark" aria-hidden="true">✓</span>
            <span>绑定任务：{taskTitle}</span>
          </li>
        ) : null}
        <li data-ok="true">
          <span className="topic-preflight-mark" aria-hidden="true">✓</span>
          <span>本场约 {phaseCount} 个阶段 · 项目记忆{memoryEnabled ? '已开启' : '已关闭'}</span>
        </li>
      </ul>
    </div>
  );
}

export function ConfigReminderBar({ snippet, steps, onCopied, onOpenGuide }) {
  return (
    <div className="config-reminder" role="region" aria-label="配置提醒">
      <p>
        <b>尚未配置 API Key</b>
        <span>当前为演示模式。填写 .env 并重启服务后可发起真实审议。</span>
      </p>
      <div className="config-reminder-actions">
        <Button type="button" variant="secondary" size="sm" onClick={onOpenGuide}>查看配置步骤</Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={async () => {
            try {
              await navigator.clipboard?.writeText(snippet);
              onCopied?.();
            } catch { /* ignore */ }
          }}
        >
          复制 .env 片段
        </Button>
      </div>
    </div>
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

export { ACT_LABELS, EVIDENCE_LABELS, EVIDENCE_TOOLTIPS } from './lib/turnDisplay.js';

function BubbleProtocolDetails({ act, phase, evidenceLabel, confidence, providerName }) {
  const hasProtocol = act || phase || evidenceLabel || typeof confidence === 'number' || providerName;
  if (!hasProtocol) return null;

  return (
    <details className="bubble-protocol-details">
      <summary>记录标注</summary>
      <div className="bubble-protocol">
        {phase && <span className="tag tag-phase">{formatPhaseLabel(phase)}</span>}
        {act && <span className={`tag tag-act-${(act || '').toLowerCase()}`}>{ACT_LABELS[act] || act}</span>}
        {evidenceLabel && (
          <span
            className={`tag tag-evidence tag-evidence--${evidenceLabel}`}
            title={EVIDENCE_TOOLTIPS[evidenceLabel] || EVIDENCE_LABELS[evidenceLabel]}
          >
            {EVIDENCE_LABELS[evidenceLabel] || evidenceLabel}
          </span>
        )}
        {typeof confidence === 'number' && (
          <span className="tag">置信 {Math.round(confidence * 100)}%</span>
        )}
        {providerName && <span className="tag tag-provider">{providerName}</span>}
      </div>
    </details>
  );
}

export function Bubble({
  persona,
  text,
  isLive,
  citations,
  stance,
  isUser,
  isStreaming,
  act,
  phase,
  confidence,
  evidenceLabel,
  providerName,
  dimmed,
  canRegenerate,
  regenerating,
  onRegenerate,
  workspace,
}) {
  const displayText = humanizeUserFacingText(text, workspace);

  if (isUser) {
    return (
      <div className="bubble user">
        <div className="bubble-meta">
          <span className="bubble-name">执行官 (你)</span>
        </div>
        <div className="bubble-text">{displayText}</div>
      </div>
    );
  }

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
          <div className="bubble-stance" data-stance={stance}>{STANCE_FULL[stance]}</div>
        )}
        {canRegenerate && onRegenerate && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="bubble-regen-btn"
            disabled={regenerating}
            onClick={onRegenerate}
            title="保留前后文，仅重生成该角色这一轮发言"
          >
            {regenerating ? '生成中…' : '重生成'}
          </Button>
        )}
      </div>
      <BubbleProtocolDetails
        act={act}
        phase={phase}
        evidenceLabel={evidenceLabel}
        confidence={confidence}
        providerName={providerName}
      />
      <div className="bubble-text">
        {displayText}
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

export function VoteCard({ vote, personas, workspace }) {
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
              <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                {humanizeUserFacingText(result.reason, workspace)}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--line)', fontStyle: 'italic', color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.7 }}>
        {humanizeUserFacingText(vote.summary, workspace)}
      </div>
    </div>
  );
}

function clipWorkspaceText(text, max = 200) {
  const clean = String(text || '').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max)}…`;
}

function formatActionLabel(item) {
  return item?.action || item?.text || item?.description || '';
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
          <span>审议工作台</span>
        </div>
        <b>{openTensions.length} 个开放分歧</b>
      </div>
      <div className="structured-grid">
        <div id="workspace-tensions" className="workspace-section">
          <h4><span className="dot danger"></span> 未解决分歧</h4>
          {openTensions.length ? openTensions.slice(0, 5).map((item) => (
            <div key={item.id} className="workspace-item">
              <p title={item.description}>{clipWorkspaceText(item.description)}</p>
            </div>
          )) : <p className="empty-text">暂无开放中的核心分歧。</p>}
        </div>
        <div id="workspace-questions" className="workspace-section">
          <h4><span className="dot warning"></span> 开放问题</h4>
          {questions.length ? questions.slice(0, 5).map((item) => (
            <div key={item.id} className="workspace-item">
              <p title={item.question}>{clipWorkspaceText(item.question)}</p>
            </div>
          )) : <p className="empty-text">暂无需要用户补充或裁决的问题。</p>}
        </div>
        <div id="workspace-evidence" className="workspace-section">
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
          <Button variant="subtle" className="console-btn" onClick={() => onAction?.('probe')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            补缺口
          </Button>
          <Button variant="subtle" className="console-btn" onClick={() => onAction?.('summarize')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 6h18M3 12h18M3 18h12" />
            </svg>
            收束判断
          </Button>
          <Button variant="subtle" className="console-btn" onClick={() => onAction?.('tensions')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m17 5 5 5-5 5" />
              <path d="m7 19-5-5 5-5" />
              <path d="M2 14h20" />
            </svg>
            处理分歧
          </Button>
        </div>
      )}
    </div>
  );
}

/** 审议完成态：四格一览（路径 / 待澄清 / 行动 / 导出），降低复盘认知负担 */
export function DeliberationOutcomePanel({
  meeting,
  pendingMemoryCount = 0,
  panelRef,
  showContinueLink = false,
  onJumpToWorkspace,
  topic = '',
  onExportCouncilAudit,
  onOpenForkCompare,
  forkCompareAvailable = false,
}) {
  const packet = meeting?.decisionPacket;
  const workspace = meeting?.workspace;

  if (!packet && !workspace) {
    return (
      <div
        ref={panelRef}
        className="outcome-panel outcome-panel-empty"
        role="region"
        aria-label="审议结果一览"
      >
        <p className="outcome-empty-state">
          完整记录生成不完整，请重算收束或查看下方「完整审议记录」。
        </p>
      </div>
    );
  }

  const selected = packet?.selectedOption ?? {};
  const decided = selected.description || '（暂无封装建议，可重算收束或查看下方完整记录）';
  const confidence =
    typeof selected.confidence === 'number' ? `${Math.round(selected.confidence * 100)}%` : null;
  const voteLine = meeting?.vote?.summary
    ? clipWorkspaceText(humanizeUserFacingText(meeting.vote.summary, workspace), 120)
    : null;

  const allOpenTensions = (workspace?.tensions ?? []).filter((t) => t.status === 'open');
  const questionItems = (workspace?.openQuestions ?? [])
    .slice(0, 3)
    .filter((q) => q.question)
    .map((q, index) => ({ key: q.id ?? `question-${index}`, text: q.question }));

  const tensionItems = allOpenTensions
    .slice(0, 2)
    .filter((t) => t.description)
    .map((t, index) => ({ key: t.id ?? `tension-${index}`, text: t.description }));

  const objectionItems = (packet?.residualObjections ?? [])
    .slice(0, 3)
    .filter((o) => o.objection)
    .map((o, index) => ({ key: `objection-${o.raisedBy ?? index}`, text: o.objection }));

  let unresolvedItems = questionItems.length ? questionItems : tensionItems;
  if (unresolvedItems.length < 2 && objectionItems.length) {
    const merged = [...unresolvedItems];
    for (const item of objectionItems) {
      if (merged.length >= 3) break;
      if (!merged.some((m) => m.text === item.text)) merged.push(item);
    }
    unresolvedItems = merged.slice(0, 3);
  } else if (!unresolvedItems.length) {
    unresolvedItems = objectionItems.slice(0, 3);
  }

  const showWorkspaceFootnote =
    (workspace?.openQuestions?.length ?? 0) > 3 ||
    allOpenTensions.length > 2 ||
    (questionItems.length > 0 && allOpenTensions.length > 0);

  const actionItems = (packet?.actionItems ?? workspace?.actionItems ?? [])
    .slice(0, 3)
    .filter((item) => formatActionLabel(item));

  return (
    <div ref={panelRef} className="outcome-panel" role="region" aria-label="审议结果一览">
      <CognitiveCouncilPanel
        meeting={meeting}
        topic={topic}
        onExportAudit={onExportCouncilAudit}
      />
      <div className="outcome-panel-head">
        <h2>审议结果一览</h2>
        <p>30 秒内看清：定了什么、还缺什么、下一步做什么、如何带走成果</p>
      </div>
      <div className="outcome-grid">
        <section className="outcome-cell outcome-cell-primary">
          <h3>已定路径</h3>
          <p className="outcome-lead" title={decided}>{clipWorkspaceText(decided, 160)}</p>
          <div className="outcome-meta">
            {packet?.decisionType && (
              <span className="outcome-tag">{formatDecisionTypeLabel(packet.decisionType)}</span>
            )}
            {confidence && <span className="outcome-tag">置信 {confidence}</span>}
          </div>
          {voteLine && <p className="outcome-foot">投票摘要：{voteLine}</p>}
        </section>

        <section className="outcome-cell">
          <h3>仍待澄清</h3>
          {unresolvedItems.length ? (
            <ul className="outcome-list">
              {unresolvedItems.map((item) => (
                <li key={item.key} title={item.text}>{clipWorkspaceText(item.text, 100)}</li>
              ))}
            </ul>
          ) : (
            <p className="outcome-empty">无登记中的开放问题、核心分歧或保留异议。</p>
          )}
          {showWorkspaceFootnote && (
            <p className="outcome-foot">
              完整列表见
              {' '}
              <button type="button" className="outcome-jump-link" onClick={() => onJumpToWorkspace?.('workspace-tensions')}>
                审议工作台 · 分歧
              </button>
              {questionItems.length > 0 && (
                <>
                  {' · '}
                  <button type="button" className="outcome-jump-link" onClick={() => onJumpToWorkspace?.('workspace-questions')}>
                    开放问题
                  </button>
                </>
              )}
            </p>
          )}
        </section>

        <section className="outcome-cell">
          <h3>下一步行动</h3>
          {actionItems.length ? (
            <ol className="outcome-list outcome-list-numbered">
              {actionItems.map((item, index) => (
                <li key={item.id ?? `action-${index}`} title={formatActionLabel(item)}>
                  {clipWorkspaceText(formatActionLabel(item), 100)}
                  {item.owner ? <small> · {item.owner}</small> : null}
                </li>
              ))}
            </ol>
          ) : (
            <p className="outcome-empty">暂无行动项，见下方「决策纪要包」或重算收束。</p>
          )}
        </section>

        <section className="outcome-cell outcome-cell-export">
          <h3>带走成果</h3>
          <ul className="outcome-export-steps">
            <li><strong>推荐</strong> <a className="outcome-export-link" href="#finish-actions">导出 HTML 复盘包</a> — 含证据说明与完整过程</li>
            <li><a className="outcome-export-link" href="#finish-actions">导出证据矩阵 (HTML)</a> — 发言与证据池对照表</li>
            <li><a className="outcome-export-link" href="#finish-actions">复制核心结论</a> — 发消息或贴进文档</li>
            <li><a className="outcome-export-link" href="#finish-actions">生成分享链接</a> — 在线只读复盘</li>
            {forkCompareAvailable && onOpenForkCompare ? (
              <li>
                <button type="button" className="outcome-jump-link" onClick={onOpenForkCompare}>
                  打开假设对比工作台
                </button>
                {' '}
                — 并排查看两场结论差异
              </li>
            ) : null}
            {showContinueLink ? (
              <li>
                <a className="outcome-export-link" href="#continue-deliberation">或于下方「后续动作」继续审议</a>
                {' '}— 注入本场结论与风险
              </li>
            ) : (
              <li>
                <a className="outcome-export-link" href="#finish-actions">返回工作台</a>
                {' '}— 配置 API 后可继续审议，或导出本场成果
              </li>
            )}
          </ul>
          <p className="outcome-privacy-hint">
            分享链接与 HTML 文件包含完整审议内容，请勿发给未授权对象。
          </p>
          {pendingMemoryCount > 0 && (
            <p className="outcome-memory-hint">
              右侧「项目记忆审批」有 <b>{pendingMemoryCount}</b> 条待确认，批准后用于未来审议
            </p>
          )}
        </section>
      </div>
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
            <Button variant="ghost" onClick={() => onReject([change.id])}>暂不入库</Button>
            <Button variant="secondary" onClick={() => onApprove([change.id])}>确认入库此判断</Button>
          </div>
        </div>
      ))}
      {changes.length > 1 && (
        <div className="memory-review-actions">
          <Button variant="ghost" onClick={() => onReject(changes.map((item) => item.id))}>全部暂不入库</Button>
          <Button variant="secondary" onClick={() => onApprove(changes.map((item) => item.id))}>全部确认入库</Button>
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
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200 }} onClick={onClose} />
      <div className="drawer">
        <div className="drawer-head">
          <div className="avatar lg" style={{ '--ai-color': draft.color }}>{draft.name}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>档案：{draft.name}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>此配置将同步至机要处</div>
          </div>
          <Button variant="subtle" onClick={onClose} style={{ fontSize: 24, opacity: 0.4 }} aria-label="关闭">✕</Button>
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
          <Button variant="ghost" onClick={onReset}>恢复初始</Button>
          <Button variant="primary" onClick={() => { onSave(draft); onClose(); }}>保存档案</Button>
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
        <span className="setup-guide-privacy">API Key 仅在服务端读取，不会写入浏览器或导出文件。</span>
      </div>
      <ol className="setup-guide-steps">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <pre className="setup-guide-snippet">{snippet}</pre>
      <div className="setup-guide-actions">
        <Button type="button" variant="primary" className={copied ? 'export-success' : ''} onClick={handleCopy}>
          {copied ? '已复制到剪贴板' : '复制最小 .env 配置'}
        </Button>
        <code className="setup-guide-hint">npm run doctor</code>
      </div>
    </section>
  );
}

function formatHealthCheckedAt(timestamp) {
  if (!timestamp) return null;
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function OnboardingWizard({
  step,
  totalSteps,
  health,
  snippet,
  steps,
  onAdvance,
  onComplete,
  onSkip,
  onCopied,
  onCheckHealth,
  onStartDemo,
  onStartFirstMeeting,
}) {
  const labels = ['欢迎', '配置', '验证', '首场审议'];
  const aiReady = health?.aiConfigured === true;
  const serviceDown = health?.ok === false;
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState(null);
  const [lastCheckedAt, setLastCheckedAt] = useState(() => (aiReady ? Date.now() : null));

  useEffect(() => {
    if (aiReady) {
      setCheckError(null);
      setLastCheckedAt((prev) => prev ?? Date.now());
    }
  }, [aiReady, health?.providerName, health?.model]);

  const handleCheckHealth = async () => {
    if (!onCheckHealth) return;
    setChecking(true);
    setCheckError(null);
    try {
      const result = await onCheckHealth();
      setLastCheckedAt(Date.now());
      if (result && !result.ok) {
        setCheckError(result.error || '无法连接本地服务，请确认 npm run dev 已启动');
        return;
      }
      const nextHealth = result?.health ?? health;
      if (nextHealth && !nextHealth.aiConfigured) {
        setCheckError('服务端未识别 API Key。请确认 .env 已保存并重启 npm run dev。');
      }
    } catch (error) {
      setLastCheckedAt(Date.now());
      setCheckError(error?.message || '健康检查失败，请确认服务已启动');
    } finally {
      setChecking(false);
    }
  };

  const handleStartDemo = () => {
    onStartDemo?.();
  };

  const handleStartFirstMeeting = async () => {
    const started = await onStartFirstMeeting?.();
    if (started) onComplete?.();
  };

  const checkedLabel = formatHealthCheckedAt(lastCheckedAt);

  return (
    <section className="onboarding-wizard" aria-label="首次成功向导">
      <div className="onboarding-wizard-head">
        <b>首次成功路径</b>
        <span>步骤 {step + 1}/{totalSteps} · {labels[step]}</span>
        <Button type="button" variant="ghost" size="sm" onClick={onSkip}>跳过</Button>
      </div>
      <div className="onboarding-steps" role="tablist" aria-label="向导进度">
        {labels.map((label, idx) => (
          <span
            key={label}
            className={`onboarding-step${idx === step ? ' active' : ''}${idx < step ? ' done' : ''}`}
          >
            {label}
          </span>
        ))}
      </div>

      {step === 0 && (
        <div className="onboarding-body">
          <p>圆桌智库把议题审议成可回看的判断资产：审议结束后可用结果一览、证据标注、单轮重生成与继续审议，而不是一次性对话。</p>
          <p>首次路径：配置模型 → 验证连接 → 演示（直接看结论）或发起真实审议。演示无需 API Key。</p>
          <Button type="button" variant="primary" onClick={onAdvance}>开始</Button>
        </div>
      )}

      {step === 1 && (
        <div className="onboarding-body">
          <SetupGuidePanel snippet={snippet} steps={steps} onCopied={onCopied} />
          <Button type="button" variant="primary" onClick={onAdvance}>已配置，下一步</Button>
        </div>
      )}

      {step === 2 && (
        <div className="onboarding-body">
          <p>确认本地服务已识别 API Key（修改 .env 后需重启 <code>npm run dev</code>）。启动时已检测到配置将直接显示就绪。</p>
          <div className="onboarding-actions">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCheckHealth}
              disabled={checking}
              loading={checking}
            >
              {checking ? '检查中…' : '检查连接'}
            </Button>
            {aiReady ? (
              <span className="onboarding-ok">已连接：{health.providerName} · {health.model}</span>
            ) : checkError ? (
              <span className="onboarding-warn" role="alert">{checkError}</span>
            ) : serviceDown ? (
              <span className="onboarding-warn" role="alert">无法访问 /api/health，请先启动 npm run dev</span>
            ) : (
              <span className="onboarding-warn">尚未就绪：保存 .env 并重启服务后再检查</span>
            )}
          </div>
          {checkedLabel && (
            <p className="onboarding-check-meta">上次检查：{checkedLabel}{aiReady && !checking ? ' · 可继续' : ''}</p>
          )}
          <Button type="button" variant="primary" onClick={onAdvance}>
            {getVerifyStepContinueLabel(aiReady)}
          </Button>
        </div>
      )}

      {step === 3 && (
        <div className="onboarding-body">
          <p>完成首场审议后，工作台将展示<strong>审议结果一览</strong>与导出。演示会<strong>直接打开示例结论</strong>（也可之后选择逐条回放）。真实审议需模型已就绪。</p>
          <div className="onboarding-actions">
            <Button type="button" variant="ghost" onClick={handleStartDemo}>打开演示结论</Button>
            <Button type="button" variant="primary" onClick={handleStartFirstMeeting} disabled={!aiReady}>
              发起真实审议
            </Button>
            <Button type="button" variant="subtle" onClick={onComplete}>已完成，收起向导</Button>
          </div>
        </div>
      )}
    </section>
  );
}

export function ContinueDeliberationPanel({
  value, onChange, onSubmit, disabled, disabledHint, panelRef, meeting,
}) {
  const suggestions = useMemo(
    () => (meeting ? buildContinueSuggestions(meeting, 3) : []),
    [meeting],
  );

  return (
    <section
      ref={panelRef}
      id="continue-deliberation"
      className="continue-panel"
      aria-label="基于本场继续审议"
    >
      <div className="continue-panel-head">
        <b>继续审议</b>
        <span id="continue-panel-hint">{disabledHint || '带着本场结论与风险登记，发起下一场继续审议。'}</span>
      </div>
      {suggestions.length > 0 && (
        <div className="continue-suggestions" aria-label="建议追问">
          <span className="continue-suggestions-label">从本场待澄清出发：</span>
          <div className="continue-suggestions-chips">
            {suggestions.map((s) => (
              <Chip
                key={s}
                className="continue-suggestion-chip"
                onClick={() => !disabled && onChange(s)}
                title={s}
              >
                {s.length > 42 ? `${s.slice(0, 40)}…` : s}
              </Chip>
            ))}
          </div>
        </div>
      )}
      <textarea
        className="textarea continue-panel-input"
        rows={2}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="例如：如果预算砍半，最小验证路径是什么？"
        disabled={disabled}
        aria-describedby="continue-panel-hint"
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey && !disabled) {
            event.preventDefault();
            onSubmit?.();
          }
        }}
      />
      <Button
        type="button"
        variant="secondary"
        onClick={onSubmit}
        disabled={disabled}
        title={disabledHint}
        aria-describedby="continue-panel-hint"
      >
        基于此发起继续审议
      </Button>
    </section>
  );
}

export { ScenarioManager } from './components/ScenarioManager.jsx';
export { TaskPanel } from './components/TaskPanel.jsx';
