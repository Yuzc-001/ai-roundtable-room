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
    expect(source).toContain('onTopicChange={setTopic}');
    expect(source).toContain('top-nav--lobby');
    expect(source).toContain('showEmptySessionPrimary');

    const draftSource = await readFile(new URL('./components/session/WorkbenchDraft.jsx', import.meta.url), 'utf8');
    expect(draftSource).toContain('<textarea');
    expect(draftSource).toContain('topic-input');
    expect(draftSource).toContain('delib-draft-topic');
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

    // 1.3.2 UI kit wiring (meaningful guard — not only legacy btn strings)
    expect(source).toContain("from './ui/index.js'");
    expect(source).toContain('<Button');
    expect(source).toContain('<Chip');
    expect(source).toContain('<IconButton');
    expect(source).toContain('SIDEBAR_SCENARIO_LIMIT');
    expect(source).toContain('<WorkbenchDraft');
    expect(source).toContain('DecisionReadinessPanel');
    expect(source).toContain('DeliberationConsole');
    expect(source).toContain('DecisionSidebar');
    expect(source).toContain('ForkCompareWorkbench');
    expect(source).toContain('useSteppedDeliberation');
    expect(source).toContain('primaryActionLabel');
    expect(source).toContain('showEmptySessionPrimary');
    expect(source).toContain('showSidebarStartCta');
    expect(source).toContain('workbench-tasks');
    expect(source).toContain('workbench-history');
    expect(source).toContain('data-mobile-info-panel');
    expect(source).toContain('data-sidebar');
    expect(source).toContain('data-right-panel');
    expect(source).toContain('roundtable:leftPanelOpen');
    expect(source).toContain('panel-rail');
    expect(source).toContain('toggleFocusMode');
    expect(source).toContain('SessionRoom');
    expect(source).toContain('sessionReading');
    expect(source).toContain('WorkbenchDraft');
    expect(source).toContain('main-content--delib');

    const scenarioSource = await readFile(new URL('./components/ScenarioManager.jsx', import.meta.url), 'utf8');
    expect(scenarioSource).toContain('aria-expanded={open}');
    expect(scenarioSource).toContain('aria-modal="true"');

    // Additional a11y + state smoke for migrated elements (no new deps)
    expect(source).toContain('onStarter={(kind)');
    expect(source).toContain("kind === 'product'");
    expect(source).toContain('data-on='); // memory-toggle state
    expect(source).toContain('className="memory-toggle"');
    expect(source).toMatch(/<Button[^>]*variant="subtle"[^>]*className="memory-toggle"/);
    expect(source).toContain('SetupGuidePanel');
    expect(source).toContain('ContinueDeliberationPanel');
    expect(source).toContain('buildContinuationContext');
    expect(source).toContain('focusSpeakerId');
    expect(source).toContain('focusSpeakerId');
    expect(source).toContain('regenerateTurnRequest');
    expect(source).toContain('refreshClosureRequest');
    expect(source).toContain('OnboardingWizard');
    expect(source).toContain('canRegenerateTurn');
    expect(source).toContain('DeliberationOutcomePanel');
    expect(source).toContain('带走审议成果');
    expect(source).toContain('后续动作');
    expect(source).toContain('continuePanelRef');
    expect(source).toContain('h2 className="finish-actions-label"');
    expect(source).toContain('id="finish-actions"');
    expect(source).toContain('outcomePanelRef');
    expect(source).toContain('已基于上一场发起继续审议');
    expect(source).toContain('shouldScrollToOutcomeRef');
    expect(source).toContain('记录不完整，请查看下方或重算收束');
    const componentsSource = await readFile(new URL('./components.jsx', import.meta.url), 'utf8');
    expect(componentsSource).toContain('continue-deliberation');
    expect(componentsSource).toContain('bubble-regen-btn');
    expect(componentsSource).toContain('DeliberationOutcomePanel');
    expect(componentsSource).toContain('审议结果一览');
    expect(componentsSource).toContain('outcome-panel');
    expect(source).toContain('filterMeetings');
    expect(source).toContain('history-search');
    expect(source).toContain('TOPIC_TEMPLATES');
    expect(source).toContain('topicTemplates={TOPIC_TEMPLATES}');
    expect(source).toContain('exportEvidenceMatrix');
    expect(source).toContain('formatEvidenceMatrixExportPage');
    expect(componentsSource).toContain('导出证据矩阵');
  });
});
