import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

describe('styles import chain', () => {
  test('styles.css imports split layers and defines ui-chip', () => {
    const master = readFileSync(join(root, 'styles.css'), 'utf8');
    expect(master).toContain('./src/styles/tokens.css');
    expect(master).toContain('./src/styles/components/buttons.css');
    expect(master).toContain('./src/styles/layout/shell.css');
    expect(master).toContain('./src/styles/landing.css');
    expect(master).toContain('./src/styles/deliberation-session.css');

    const buttons = readFileSync(join(root, 'src/styles/components/buttons.css'), 'utf8');
    expect(buttons).toContain('.ui-chip');
    expect(buttons).toContain('.btn-secondary');
  });
});