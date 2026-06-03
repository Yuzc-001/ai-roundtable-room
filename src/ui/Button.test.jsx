import { renderToString } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { Button } from './Button.jsx';

describe('Button', () => {
  test('renders five variant class names', () => {
    const variants = ['primary', 'secondary', 'ghost', 'subtle', 'danger'];
    for (const variant of variants) {
      const html = renderToString(<Button variant={variant}>Go</Button>);
      expect(html).toContain(`btn-${variant}`);
      expect(html).toContain('btn-label');
    }
  });

  test('applies loading and disabled state', () => {
    const html = renderToString(
      <Button variant="primary" loading disabled>
        Wait
      </Button>,
    );
    expect(html).toContain('btn-loading');
    expect(html).toContain('btn-spinner');
    expect(html).toContain('disabled');
    expect(html).toContain('aria-busy="true"');
  });

  test('supports small size', () => {
    const html = renderToString(<Button size="sm">Small</Button>);
    expect(html).toContain('btn-sm');
  });

  test('renders anchor when href is provided', () => {
    const html = renderToString(
      <Button href="https://example.com" variant="ghost" target="_blank" rel="noreferrer">
        Source
      </Button>,
    );
    expect(html).toContain('<a ');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('btn-ghost');
  });

  test('merges custom className and loading label class', () => {
    const html = renderToString(
      <Button variant="primary" className="empty-session-primary" loading>
        Go
      </Button>,
    );
    expect(html).toContain('empty-session-primary');
    expect(html).toContain('btn-label--loading');
  });
});