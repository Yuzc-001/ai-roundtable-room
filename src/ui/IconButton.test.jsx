import { renderToString } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { IconButton } from './IconButton.jsx';

describe('IconButton', () => {
  test('requires aria-label and uses icon-btn-lite + subtle', () => {
    const html = renderToString(
      <IconButton label="打开菜单">
        <span aria-hidden="true">≡</span>
      </IconButton>,
    );
    expect(html).toContain('aria-label="打开菜单"');
    expect(html).toContain('icon-btn-lite');
    expect(html).toContain('btn-subtle');
  });

  test('applies active class when selected', () => {
    const html = renderToString(
      <IconButton label="专注" active>
        <span />
      </IconButton>,
    );
    expect(html).toContain('active');
  });
});