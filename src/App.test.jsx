import { renderToString } from 'react-dom/server';
import { readFile } from 'node:fs/promises';
import { describe, expect, test } from 'vitest';
import App from './App.jsx';

describe('App initial experience', () => {
  test('renders the open-source landing page before the workbench', () => {
    const html = renderToString(<App />);

    expect(html).toContain('本地运行 · 开源');
    expect(html).toContain('议题写出来，判断留得住');
    expect(html).toContain('进一步了解');
    expect(html).toContain('圆桌智库');
    expect(html).toContain('/remotion/home-2026-05.png');
    expect(html).toContain('适用场景');
    expect(html).toContain('常见问题');
    expect(html).toContain('https://github.com/Yuzc-001/ai-roundtable-room');
    expect(html).toContain('进入工作台');
    expect(html).not.toContain('<textarea');
    expect(html).not.toContain('样例会议 ·');
    expect(html).not.toContain('发言中 · 1 /');
  });

  test('keeps the interactive workbench behind an explicit entry action', async () => {
    const source = await readFile(new URL('./App.jsx', import.meta.url), 'utf8');

    expect(source).toContain('resolveAppView');
    expect(source).toContain('navigateLanding');
    expect(source).toContain('LandingSite');
    expect(source).toContain("setViewMode('workspace')");
    expect(source).toContain('onEnter={enterWorkbench}');
    expect(source).toContain('<textarea');
    expect(source).toContain('topic-input'); // Base UI .textarea.topic-input applied (migration complete)
  });

  test('renders project controls without browser prompts', async () => {
    const source = await readFile(new URL('./App.jsx', import.meta.url), 'utf8');

    expect(source).not.toContain('window.prompt');
    expect(source).toContain('新项目名称');
    expect(source).toContain('项目记忆');
    expect(source).toContain('删除项目');
    expect(source).toContain('归档箱');
    expect(source).toContain('恢复');
    expect(source).toContain('彻底删除');

    // Base UI migration smoke (static source): new system classes present after full sweep
    expect(source).toContain('btn btn-primary');
    expect(source).toContain('btn btn-ghost');

    // Additional a11y + state smoke for migrated elements (no new deps)
    expect(source).toContain('aria-label="启动产品认知压测"');
    expect(source).toContain('data-on='); // memory-toggle state
    expect(source).toContain('btn btn-subtle memory-toggle');
    expect(source).toContain('SetupGuidePanel');
    expect(source).toContain('ContinueDeliberationPanel');
    expect(source).toContain('buildContinuationContext');
    expect(source).toContain('focusSpeakerId');
    expect(source).toContain('dimmed={focusSpeakerId');
    expect(source).toContain('regenerateTurnRequest');
    expect(source).toContain('refreshClosureRequest');
    expect(source).toContain('OnboardingWizard');
    expect(source).toContain('canRegenerateTurn');
    expect(source).toContain('DeliberationOutcomePanel');
    expect(source).toContain('带走审议成果');
    expect(source).toContain('后续动作');
    expect(source).toContain('id="finish-actions"');
    expect(source).toContain('outcomePanelRef');
    expect(source).toContain('shouldScrollToOutcomeRef');
    expect(source).toContain('记录不完整，请查看下方或重算收束');
    const componentsSource = await readFile(new URL('./components.jsx', import.meta.url), 'utf8');
    expect(componentsSource).toContain('bubble-regen-btn');
    expect(componentsSource).toContain('DeliberationOutcomePanel');
    expect(componentsSource).toContain('审议结果一览');
    expect(componentsSource).toContain('outcome-panel');
  });
});
