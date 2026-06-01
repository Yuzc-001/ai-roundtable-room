import { renderToString } from 'react-dom/server';
import { readFile } from 'node:fs/promises';
import { describe, expect, test } from 'vitest';
import App from './App.jsx';

describe('App initial experience', () => {
  test('renders the open-source landing page before the workbench', () => {
    const html = renderToString(<App />);

    expect(html).toContain('开源 · 本地优先 · 可自部署');
    expect(html).toContain('把复杂问题变成可复盘的决策包');
    expect(html).toContain('本地部署');
    expect(html).toContain('FAQ');
    expect(html).toContain('https://github.com/Yuzc-001/ai-roundtable-room');
    expect(html).toContain('进入工作台');
    expect(html).not.toContain('<textarea');
    expect(html).not.toContain('样例会议 ·');
    expect(html).not.toContain('发言中 · 1 /');
  });

  test('keeps the interactive workbench behind an explicit entry action', async () => {
    const source = await readFile(new URL('./App.jsx', import.meta.url), 'utf8');

    expect(source).toContain("window.location.pathname === '/app' ? 'workspace' : 'landing'");
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
  });
});
