import { SessionChrome } from './SessionChrome.jsx';
import { SessionClosure } from './SessionClosure.jsx';
import { SessionMinutes } from './SessionMinutes.jsx';
import { SessionPresence } from './SessionPresence.jsx';

/**
 * 审议回放整页：独立议事厅，不拼凑旧顶栏 + feed + stage。
 */
export function SessionRoom({
  transcriptRef,
  chrome,
  minutes,
  presence,
  banners = null,
  closure = null,
}) {
  return (
    <div className="delib-room">
      <SessionChrome {...chrome} />
      {banners}
      <div className="delib-room-scroll" ref={transcriptRef}>
        <SessionMinutes {...minutes} />
        {closure ? <SessionClosure>{closure}</SessionClosure> : null}
      </div>
      <SessionPresence {...presence} />
    </div>
  );
}