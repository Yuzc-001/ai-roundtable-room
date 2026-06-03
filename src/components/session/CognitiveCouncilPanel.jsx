function StageBadge({ done, label }) {
  return (
    <span className={`council-stage ${done ? 'council-stage--done' : ''}`}>
      {done ? '✓ ' : ''}
      {label}
    </span>
  );
}

export function CognitiveCouncilPanel({ meeting, topic, onExportAudit }) {
  const council = meeting?.council;
  if (!council?.enabled && !council?.stage1?.length) return null;

  const ranking = council.peerRanking ?? [];
  const challenges = council.challenges ?? [];

  return (
    <section className="cognitive-council-panel" aria-label="认知议会">
      <header className="cognitive-council-panel__head">
        <h3>认知议会</h3>
        <p className="muted">并行首答 → 盲评互排 → 主席裁决（非会议室表演）</p>
      </header>

      <div className="cognitive-council-panel__stages">
        <StageBadge done={council.stage1?.length > 0} label="Stage 1 · 并行首答" />
        <StageBadge done={council.stage2?.length > 0} label="Stage 2 · 盲评互排" />
        <StageBadge done={Boolean(council.chairman)} label="Stage 3 · 主席包" />
      </div>

      {ranking.length > 0 && (
        <div className="council-ranking">
          <h4>盲评排名（已做长度校正）</h4>
          <ol>
            {ranking.map((row) => (
              <li key={row.anonymousId}>
                <span className="council-rank-id">{row.anonymousId}</span>
                {' '}
                <span className="muted">{row.speakerId}</span>
                {' · '}
                {row.totalScore}
                分
              </li>
            ))}
          </ol>
        </div>
      )}

      {challenges.length > 0 && (
        <div className="council-challenges">
          <h4>挑战关系</h4>
          <ul>
            {challenges.map((ch, i) => (
              <li key={`${ch.challenger}-${i}`}>
                {ch.challenger}
                {' '}
                质疑
                {' '}
                {ch.target}
                ：
                {ch.issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {council.chairman?.synthesis && (
        <blockquote className="council-chair">
          <strong>主席综合：</strong>
          {council.chairman.synthesis}
        </blockquote>
      )}

      {onExportAudit && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={onExportAudit}>
          导出审计页（谁挑战了谁）
        </button>
      )}
    </section>
  );
}