import { Button } from '../../ui/index.js';

export function SessionPresence({
  personas,
  allPersonas,
  speakerId,
  focusSpeakerId,
  onSeatClick,
  onClearFocus,
  focusNotice,
  onUndoRegen,
}) {
  const speaker = speakerId ? personas[speakerId] : null;

  return (
    <footer className="delib-presence" aria-label="在场席位">
      {(focusSpeakerId || focusNotice) && (
        <div className="delib-presence-banner">
          {focusSpeakerId ? (
            <>
              <span>正在阅读 <b>{personas[focusSpeakerId]?.name || focusSpeakerId}</b> 的发言</span>
              <Button type="button" variant="ghost" size="sm" onClick={onClearFocus}>显示全部</Button>
            </>
          ) : (
            <>
              <span>{focusNotice}</span>
              {onUndoRegen && (
                <Button type="button" variant="ghost" size="sm" onClick={onUndoRegen}>撤销</Button>
              )}
            </>
          )}
        </div>
      )}
      <div className="delib-presence-track" role="toolbar" aria-label="选择聚焦的发言人">
        {allPersonas.map((persona) => {
          const speaking = persona.id === speakerId;
          const focused = persona.id === focusSpeakerId;
          return (
            <button
              key={persona.id}
              type="button"
              className={`delib-presence-seat${speaking ? ' is-speaking' : ''}${focused ? ' is-focused' : ''}`}
              aria-label={`${persona.name}${speaking ? '，正在发言' : ''}${focused ? '，已聚焦' : ''}`}
              aria-pressed={focused || speaking}
              onClick={() => onSeatClick(persona)}
              style={{ '--delib-accent': persona.color }}
            >
              <span className="delib-presence-dot" aria-hidden="true" />
              <span className="delib-presence-name">{persona.name}</span>
            </button>
          );
        })}
      </div>
      {speaker && !focusSpeakerId && (
        <p className="delib-presence-now">
          当前发言：<b>{speaker.name}</b>
        </p>
      )}
    </footer>
  );
}