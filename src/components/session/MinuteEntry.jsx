import { Button } from '../../ui/index.js';
import {
  ACT_LABELS,
  EVIDENCE_LABELS,
  EVIDENCE_TOOLTIPS,
  STANCE_SHORT,
} from '../../lib/turnDisplay.js';
import { formatPhaseLabel, humanizeUserFacingText } from '../../lib/userFacingText.js';

function TurnMeta({ act, phase, evidenceLabel, confidence, providerName, workspace }) {
  const hasMeta = act || phase || evidenceLabel || typeof confidence === 'number' || providerName;
  if (!hasMeta) return null;

  return (
    <details className="delib-minute-meta">
      <summary>书记员标注</summary>
      <ul className="delib-minute-meta-list">
        {phase && <li><span>阶段</span><b>{formatPhaseLabel(phase)}</b></li>}
        {act && <li><span>动作</span><b>{ACT_LABELS[act] || act}</b></li>}
        {evidenceLabel && (
          <li>
            <span>证据</span>
            <b title={EVIDENCE_TOOLTIPS[evidenceLabel]}>{EVIDENCE_LABELS[evidenceLabel] || evidenceLabel}</b>
          </li>
        )}
        {typeof confidence === 'number' && (
          <li><span>置信</span><b>{Math.round(confidence * 100)}%</b></li>
        )}
        {providerName && <li><span>模型</span><b>{providerName}</b></li>}
      </ul>
    </details>
  );
}

export function MinuteEntry({
  index,
  persona,
  text,
  stance,
  isLive = false,
  isStreaming = false,
  isUser = false,
  act,
  phase,
  confidence,
  evidenceLabel,
  providerName,
  citations,
  dimmed = false,
  canRegenerate = false,
  regenerating = false,
  onRegenerate,
  workspace,
}) {
  const displayText = humanizeUserFacingText(text, workspace);

  if (isUser) {
    return (
      <li className="delib-minute delib-minute--user">
        <div className="delib-minute-gutter">
          <span className="delib-minute-num">{String(index).padStart(2, '0')}</span>
        </div>
        <div className="delib-minute-content">
          <header className="delib-minute-head">
            <span className="delib-minute-who">你</span>
            <span className="delib-minute-role">执行官</span>
          </header>
          <p className="delib-minute-prose">{displayText}</p>
        </div>
      </li>
    );
  }

  return (
    <li
      className={`delib-minute${isLive ? ' delib-minute--live' : ''}${dimmed ? ' delib-minute--muted' : ''}`}
      style={{
        '--delib-accent': persona.color,
        '--delib-soft': persona.softColor,
      }}
    >
      <div className="delib-minute-gutter">
        <span className="delib-minute-num">{String(index).padStart(2, '0')}</span>
        <span className="delib-minute-glyph" aria-hidden="true">{persona.name}</span>
      </div>
      <div className="delib-minute-content">
        <header className="delib-minute-head">
          <span className="delib-minute-who">{persona.name}</span>
          {stance && (
            <span className="delib-minute-stance" data-stance={stance}>
              {STANCE_SHORT[stance] || stance}
            </span>
          )}
          {canRegenerate && onRegenerate && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="delib-minute-regen"
              disabled={regenerating}
              onClick={onRegenerate}
            >
              {regenerating ? '生成中…' : '重生成此轮'}
            </Button>
          )}
        </header>
        <p className="delib-minute-prose">
          {displayText}
          {isStreaming && <span className="delib-minute-caret" aria-hidden="true" />}
        </p>
        <TurnMeta
          act={act}
          phase={phase}
          evidenceLabel={evidenceLabel}
          confidence={confidence}
          providerName={providerName}
          workspace={workspace}
        />
        {citations?.length > 0 && (
          <footer className="delib-minute-cites">
            {citations.map((cite, idx) => (
              <span key={idx}>{cite.label}</span>
            ))}
          </footer>
        )}
      </div>
    </li>
  );
}