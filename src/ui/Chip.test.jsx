import { renderToString } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { Chip } from './Chip.jsx';

describe('Chip', () => {
  test('renders active pressed state and ghost sm classes', () => {
    const html = renderToString(<Chip active>产品</Chip>);
    expect(html).toContain('ui-chip--active');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('btn-ghost');
    expect(html).toContain('btn-sm');
  });

  test('renders inactive chip without active class', () => {
    const html = renderToString(<Chip>商业</Chip>);
    expect(html).not.toContain('ui-chip--active');
    expect(html).toContain('aria-pressed="false"');
  });
});