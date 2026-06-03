import { useMemo, useState } from 'react';
import { Button } from '../../ui/index.js';
import {
  compareDecisionPackets,
  formatMeetingOptionLabel,
  meetingEntryToCompareSource,
  suggestForkComparePair,
} from '../../lib/forkCompare.js';

function ConfidenceBadge({ value }) {
  if (value == null || value === '') return null;
  const n = Number(value);
  const label = Number.isFinite(n) ? `${Math.round(n * (n <= 1 ? 100 : 1))}%` : String(value);
  return <span className="v15-conf-badge">{label}</span>;
}

function DiffList({ title, items, variant }) {
  if (!items?.length) return null;
  return (
    <div className={`v15-fork-diff v15-fork-diff--${variant}`}>
      <h4>{title}</h4>
      <ul>{items.map((item, i) => <li key={i}>{item.action || item.description || item.objection}</li>)}</ul>
    </div>
  );
}

export function ForkCompareWorkbench({
  meetings = [],
  onClose,
  embedded = false,
}) {
  const suggested = useMemo(() => suggestForkComparePair(meetings), [meetings]);
  const [idA, setIdA] = useState(suggested?.[0]?.id ?? meetings[meetings.length - 2]?.id);
  const [idB, setIdB] = useState(suggested?.[1]?.id ?? meetings[meetings.length - 1]?.id);

  const entryA = meetings.find((m) => m.id === idA);
  const entryB = meetings.find((m) => m.id === idB);

  const diff = useMemo(
    () => compareDecisionPackets(
      meetingEntryToCompareSource(entryA),
      meetingEntryToCompareSource(entryB),
    ),
    [entryA, entryB],
  );

  if (meetings.length < 2) {
    return (
      <div className={`v15-fork ${embedded ? 'v15-fork--embedded' : ''}`}>
        <p className="v15-empty">至少需要两场历史审议才能对比。</p>
      </div>
    );
  }

  return (
    <div className={`v15-fork ${embedded ? 'v15-fork--embedded' : ''}`} role="region" aria-label="分叉对比">
      <header className="v15-fork-head">
        <div>
          <h2>假设对比</h2>
          <p>并排查看两场 Decision Packet 与行动项差异</p>
        </div>
        {onClose && (
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>关闭</Button>
        )}
      </header>

      <div className="v15-fork-pickers">
        <label>
          <span>基准场次</span>
          <select value={idA ?? ''} onChange={(e) => setIdA(Number(e.target.value))}>
            {meetings.map((m) => (
              <option key={m.id} value={m.id}>{formatMeetingOptionLabel(m)}</option>
            ))}
          </select>
        </label>
        <label>
          <span>对比场次</span>
          <select value={idB ?? ''} onChange={(e) => setIdB(Number(e.target.value))}>
            {meetings.map((m) => (
              <option key={m.id} value={m.id}>{formatMeetingOptionLabel(m)}</option>
            ))}
          </select>
        </label>
      </div>

      {!diff.ready && (
        <p className="v15-fork-warn">所选场次至少一场尚未生成完整决策纪要包，对比可能不完整。</p>
      )}

      {diff.hasPackets && (
        <p className={`v15-fork-verdict ${diff.sameSelection ? 'is-same' : 'is-diff'}`}>
          {diff.sameSelection ? '最终选项一致' : '最终选项不同 — 请重点核对理由与行动项'}
        </p>
      )}

      <div className="v15-fork-grid">
        <article className="v15-fork-card">
          <h3>{diff.labelA}</h3>
          <p className="v15-fork-choice">{diff.selectionA || '（尚无）'}</p>
          {diff.rationaleA && <p className="v15-fork-rationale">{diff.rationaleA}</p>}
          <ConfidenceBadge value={diff.confidenceA} />
          {diff.voteSummaryA && <p className="v15-fork-vote">{diff.voteSummaryA}</p>}
        </article>
        <article className="v15-fork-card v15-fork-card--alt">
          <h3>{diff.labelB}</h3>
          <p className="v15-fork-choice">{diff.selectionB || '（尚无）'}</p>
          {diff.rationaleB && <p className="v15-fork-rationale">{diff.rationaleB}</p>}
          <ConfidenceBadge value={diff.confidenceB} />
          {diff.voteSummaryB && <p className="v15-fork-vote">{diff.voteSummaryB}</p>}
        </article>
      </div>

      <DiffList title="仅基准场行动项" items={diff.actionDiff?.onlyLeft} variant="a" />
      <DiffList title="仅对比场行动项" items={diff.actionDiff?.onlyRight} variant="b" />
      <DiffList title="仅基准场未解分歧" items={diff.tensionDiff?.onlyLeft} variant="a" />
      <DiffList title="仅对比场未解分歧" items={diff.tensionDiff?.onlyRight} variant="b" />
    </div>
  );
}