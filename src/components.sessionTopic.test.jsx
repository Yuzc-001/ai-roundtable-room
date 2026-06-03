import { renderToString } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { SessionChrome } from './components/session/SessionChrome.jsx';

describe('SessionChrome (topic)', () => {
  test('renders topic as primary heading', () => {
    const topic = '如何更好求职 应届生 面试评价';
    const html = renderToString(
      <SessionChrome
        topic={topic}
        scenarioName="产品认知"
        taskTitle="秋招复盘"
        onToggleMenu={() => {}}
        onToggleLeftPanel={() => {}}
        onToggleRightPanel={() => {}}
        onToggleFocus={() => {}}
        onReturnHome={() => {}}
        onOpenLanding={() => {}}
      />,
    );
    expect(html).toContain(topic);
    expect(html).toContain('delib-chrome-chips');
    expect(html).toContain('秋招复盘');
  });

  test('falls back to meeting title', () => {
    const html = renderToString(
      <SessionChrome
        topic=""
        meetingTitle="面试反馈审议"
        onToggleMenu={() => {}}
        onToggleLeftPanel={() => {}}
        onToggleRightPanel={() => {}}
        onToggleFocus={() => {}}
        onReturnHome={() => {}}
        onOpenLanding={() => {}}
      />,
    );
    expect(html).toContain('面试反馈审议');
  });
});