import { Button } from '../../ui/index.js';

export function DeliberationConsole({
  open,
  steps = [],
  stepIndex = 0,
  currentLabel = '',
  paused = false,
  constraints = '',
  directive = '',
  onConstraintsChange,
  onDirectiveChange,
  onPause,
  onCancel,
  onInjectResume,
  onResume,
  simPhaseLabel = '',
}) {
  if (!open) return null;

  const total = Math.max(steps.length, 1);
  const pct = Math.round(((stepIndex + (paused ? 0 : 0.5)) / total) * 100);

  return (
    <div className="v15-console-backdrop" role="dialog" aria-modal="true" aria-labelledby="v15-console-title">
      <div className="v15-console">
        <header className="v15-console-head">
          <div>
            <p className="v15-console-kicker">1.5 · 分阶段审议</p>
            <h2 id="v15-console-title">{paused ? '已暂停 — 可注入约束后继续' : '审议进行中'}</h2>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>取消</Button>
        </header>

        <div className="v15-console-progress">
          <div className="v15-console-track">
            <div className="v15-console-fill" style={{ width: `${Math.min(100, pct)}%` }} />
          </div>
          <p className="v15-console-step-label">
            {currentLabel || simPhaseLabel || '准备'}
            {steps.length > 0 && (
              <span className="v15-console-step-idx"> · 步骤 {Math.min(stepIndex + 1, total)}/{total}</span>
            )}
          </p>
        </div>

        {steps.length > 0 && (
          <ol className="v15-console-timeline">
            {steps.map((s, i) => {
              const done = i < stepIndex;
              const active = i === stepIndex && !paused;
              const waiting = i === stepIndex && paused;
              return (
                <li
                  key={s.id}
                  className={[
                    done ? 'is-done' : '',
                    active ? 'is-active' : '',
                    waiting ? 'is-paused' : '',
                  ].filter(Boolean).join(' ')}
                >
                  <span className="v15-console-dot" aria-hidden="true" />
                  <span>{s.label || s.id}</span>
                </li>
              );
            })}
          </ol>
        )}

        <div className={`v15-console-inject ${paused ? 'is-open' : ''}`}>
          <label>
            <span>干预约束</span>
            <textarea
              placeholder="例：预算上限 50 万；必须过合规评审"
              value={constraints}
              onChange={(e) => onConstraintsChange?.(e.target.value)}
              disabled={!paused}
              rows={2}
            />
          </label>
          <label>
            <span>方向指令</span>
            <textarea
              placeholder="例：优先比较方案 A 与 B，不要发散到品牌"
              value={directive}
              onChange={(e) => onDirectiveChange?.(e.target.value)}
              disabled={!paused}
              rows={2}
            />
          </label>
        </div>

        <footer className="v15-console-foot">
          {!paused ? (
            <>
              <p className="v15-console-hint">下一步开始前可暂停，注入内容将写入后续阶段 prompt。</p>
              <Button type="button" variant="secondary" onClick={onPause}>暂停</Button>
            </>
          ) : (
            <>
              <Button type="button" variant="primary" onClick={onInjectResume}>注入并继续</Button>
              <Button type="button" variant="ghost" onClick={onResume}>直接继续</Button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}