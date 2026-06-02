import { readFile } from 'node:fs/promises';
import { describe, expect, test } from 'vitest';

describe('WorkspacePanel source contract', () => {
  test('lists only open tensions under unresolved section', async () => {
    const source = await readFile(new URL('./components.jsx', import.meta.url), 'utf8');
    expect(source).toContain('const openTensions = tensions.filter((item) => item.status === \'open\')');
    expect(source).toContain('openTensions.length ? openTensions.slice(0, 5)');
    expect(source).toContain('clipWorkspaceText');
  });
});

describe('history list layout styles', () => {
  test('allows history titles to wrap inside ghost buttons', async () => {
    const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
    expect(css).toContain('.history-item-main');
    expect(css).toMatch(/\.history-item-main[\s\S]*white-space:\s*normal/);
    expect(css).toContain('-webkit-line-clamp: 2');
  });
});