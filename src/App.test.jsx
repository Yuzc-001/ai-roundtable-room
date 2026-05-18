import { renderToString } from 'react-dom/server';
import { readFile } from 'node:fs/promises';
import { describe, expect, test } from 'vitest';
import App from './App.jsx';

describe('App initial experience', () => {
  test('waits for the user instead of auto-playing the demo meeting', () => {
    const html = renderToString(<App />);

    expect(html).toContain('决策上下文');
    expect(html).toContain('默认项目');
    expect(html).toContain('你好，这里是你的“数字内阁”');
    expect(html).not.toContain('样例会议 ·');
    expect(html).not.toContain('发言中 · 1 /');
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
  });
});
