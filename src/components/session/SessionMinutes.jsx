import { MinuteEntry } from './MinuteEntry.jsx';

export function SessionMinutes({
  history,
  currentTurn,
  currentSpeaker,
  revealed,
  done,
  personas,
  focusSpeakerId,
  canRegenerate,
  regeneratingTurnIndex,
  onRegenerate,
  workspace,
}) {
  const hasContent = history.length > 0 || currentTurn;

  return (
    <section className="delib-minutes" aria-label="审议发言记录">
      {!hasContent && (
        <p className="delib-minutes-empty">发言将按顺序记录在此，像会议纪要一样从上往下读。</p>
      )}
      <ol className="delib-minutes-list">
        {history.map((turn, index) => {
          const persona = personas[turn.speaker];
          if (!persona) return null;
          return (
            <MinuteEntry
              key={`${index}-${turn.speaker}-${turn.text?.slice(0, 20)}`}
              index={index + 1}
              persona={persona}
              text={turn.text}
              stance={turn.stance}
              act={turn.act}
              phase={turn.phase}
              confidence={turn.confidence}
              evidenceLabel={turn.evidenceLabel}
              providerName={turn.providerName}
              citations={turn.citations}
              dimmed={Boolean(focusSpeakerId && turn.speaker !== focusSpeakerId)}
              canRegenerate={canRegenerate}
              regenerating={regeneratingTurnIndex === index}
              onRegenerate={() => onRegenerate(index)}
              workspace={workspace}
            />
          );
        })}
        {currentTurn && currentSpeaker && (
          <MinuteEntry
            index={history.length + 1}
            persona={currentSpeaker}
            text={revealed}
            isLive
            isStreaming={!done}
            stance={currentTurn.stance}
            act={currentTurn.act}
            phase={currentTurn.phase}
            confidence={currentTurn.confidence}
            evidenceLabel={currentTurn.evidenceLabel}
            providerName={currentTurn.providerName}
            citations={currentTurn.citations}
            dimmed={Boolean(focusSpeakerId && currentTurn.speaker !== focusSpeakerId)}
            workspace={workspace}
          />
        )}
      </ol>
    </section>
  );
}