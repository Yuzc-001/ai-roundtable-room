import { renderToString } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { MinuteEntry, SessionChrome, SessionMinutes, SessionPresence, SessionRoom } from './components/session/index.js';

const PERSONA = {
  id: 'bo',
  name: '波',
  title: '观察',
  color: '#2E5A4D',
  softColor: '#e8f0ed',
};

describe('deliberation session components', () => {
  test('SessionChrome shows title and new-user guide', () => {
    const html = renderToString(
      <SessionChrome
        topic="如何更好求职"
        scenarioName="头脑风暴"
        phaseLabel="框架"
        turnCount={2}
        onToggleMenu={() => {}}
        onToggleLeftPanel={() => {}}
        onToggleRightPanel={() => {}}
        onToggleFocus={() => {}}
        onReturnHome={() => {}}
        onOpenLanding={() => {}}
      />,
    );
    expect(html).toContain('delib-chrome-title');
    expect(html).toContain('如何更好求职');
    expect(html).toContain('从上往下读发言记录');
    expect(html).toContain('沉浸阅读');
  });

  test('MinuteEntry strips internal tension ids from display text', () => {
    const html = renderToString(
      <MinuteEntry
        index={1}
        persona={PERSONA}
        text="我先把 tension-b1redx 换一个未来求职视角。"
        workspace={{
          tensions: [{
            id: 'tension-b1redx',
            description: '缺少面试具体问题与原始回答',
          }],
        }}
      />,
    );
    expect(html).not.toContain('tension-b1redx');
    expect(html).toContain('缺少面试具体问题');
  });

  test('MinuteEntry uses delib-minute layout and collapsed meta', () => {
    const html = renderToString(
      <MinuteEntry
        index={1}
        persona={PERSONA}
        text="请先确认评价发生的具体语境。"
        stance="neutral"
        phase="Frame"
        act="PROBE"
        confidence={0.8}
      />,
    );
    expect(html).toContain('delib-minute');
    expect(html).toContain('书记员标注');
    expect(html).toContain('观察');
    expect(html).not.toContain('客观观察');
  });

  test('SessionRoom composes minutes and presence', () => {
    const html = renderToString(
      <SessionRoom
        chrome={{
          topic: '测试议题',
          onToggleMenu: () => {},
          onToggleLeftPanel: () => {},
          onToggleRightPanel: () => {},
          onToggleFocus: () => {},
          onReturnHome: () => {},
          onOpenLanding: () => {},
        }}
        minutes={{
          history: [{ speaker: 'bo', text: '第一句', stance: 'neutral' }],
          currentTurn: null,
          personas: { bo: PERSONA },
          onRegenerate: () => {},
        }}
        presence={{
          personas: { bo: PERSONA },
          allPersonas: [PERSONA],
          onSeatClick: () => {},
          onClearFocus: () => {},
        }}
      />,
    );
    expect(html).toContain('delib-room');
    expect(html).toContain('delib-minutes-list');
    expect(html).toContain('delib-presence');
    expect(html).toContain('第一句');
  });

  test('SessionPresence marks speaking seat', () => {
    const html = renderToString(
      <SessionPresence
        personas={{ bo: PERSONA }}
        allPersonas={[PERSONA]}
        speakerId="bo"
        onSeatClick={() => {}}
        onClearFocus={() => {}}
      />,
    );
    expect(html).toContain('is-speaking');
    expect(html).toContain('当前发言');
  });
});