import { useMemo } from 'react';
import { buildDecisionReadiness } from '../../lib/decisionReadiness.js';

const FIT_LABEL = {
  roundtable_recommended: '推荐圆桌',
  borderline: '建议补强',
  single_model_better: '建议单模型',
};

const EVIDENCE_LABEL = { high: '高', medium: '中', low: '低' };

export function DecisionReadinessPanel({
  topic,
  health,
  scenarioName,
  taskTitle,
  memoryEnabled,
  admissionOverride,
  onAdmissionOverrideChange,
  intelSelectedCount = 0,
  phaseCount = 5,
  onOpenIntel,
}) {
  const readiness = useMemo(
    () => buildDecisionReadiness({
      topic,
      health,
      scenarioName,
      taskTitle,
      memoryEnabled,
      admissionOverride,
      intelSelectedCount,
      phaseCount,
    }),
    [topic, health, scenarioName, taskTitle, memoryEnabled, admissionOverride, intelSelectedCount, phaseCount],
  );

  if (!topic?.trim()) return null;

  const { admission, coach, checks, score, evidenceNeed, suggestSingleModel, canStart } = readiness;
  const coachLines = [...coach.warnings, ...coach.tips];

  return (
    <section className="v15-readiness" aria-label="决策就绪评估">
      <div className="v15-readiness-hero">
        <div className="v15-readiness-score" data-level={admission.fit}>
          <svg viewBox="0 0 36 36" className="v15-readiness-ring" aria-hidden="true">
            <path
              className="v15-readiness-ring-bg"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="v15-readiness-ring-fill"
              strokeDasharray={`${score}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <span className="v15-readiness-score-num">{score}</span>
        </div>
        <div className="v15-readiness-meta">
          <span className={`v15-badge v15-badge--${admission.fit}`}>{FIT_LABEL[admission.fit] || admission.headline}</span>
          <h3 className="v15-readiness-title">{admission.headline}</h3>
          <p className="v15-readiness-sub">
            证据需求 · {EVIDENCE_LABEL[evidenceNeed] || evidenceNeed}
            {intelSelectedCount === 0 && evidenceNeed !== 'low' && onOpenIntel && (
              <>
                {' · '}
                <button type="button" className="v15-link-btn" onClick={onOpenIntel}>去选材料</button>
              </>
            )}
          </p>
        </div>
      </div>

      {suggestSingleModel && (
        <div className="v15-readiness-callout v15-readiness-callout--warn">
          <p>这类问题用单模型更快。若你仍要组织多视角碰撞，请确认后继续。</p>
          <label className="v15-toggle">
            <input
              type="checkbox"
              checked={admissionOverride}
              onChange={(e) => onAdmissionOverrideChange?.(e.target.checked)}
            />
            <span className="v15-toggle-ui" aria-hidden="true" />
            <span>确认：仍开圆桌审议</span>
          </label>
        </div>
      )}

      <ul className="v15-checklist">
        {checks.map((c) => (
          <li key={c.id} className="v15-check" data-ok={c.ok ? 'true' : 'false'} data-required={c.required ? 'true' : 'false'}>
            <span className="v15-check-mark" aria-hidden="true">{c.ok ? '✓' : '○'}</span>
            <div>
              <span>{c.label}</span>
              {c.detail && <small>{c.detail}</small>}
            </div>
          </li>
        ))}
      </ul>

      {coachLines.length > 0 && (
        <details className="v15-coach-fold">
          <summary>议题教练 · {coach.charCount} 字</summary>
          <ul>{coachLines.map((line) => <li key={line}>{line}</li>)}</ul>
        </details>
      )}

      <p className={`v15-readiness-footer ${canStart ? 'is-ready' : 'is-blocked'}`} role="status">
        {canStart
          ? '检查项已满足，可点击「启动结构化审议」。'
          : suggestSingleModel && !admissionOverride
            ? '请先确认仍开圆桌，或改写议题后再启动。'
            : '请补全必填检查项后再启动。'}
      </p>
    </section>
  );
}