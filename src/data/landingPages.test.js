import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { LANDING_SITE, RELEASE_NOTES } from './landingPages.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const packageVersion = JSON.parse(
  readFileSync(join(root, 'package.json'), 'utf8'),
).version;

const ZH_12X_MARKERS = [
  '结果一览',
  '单轮发言可重生成',
  '继续审议',
  '无上传材料时不保留无源外链',
  '审议结果可以改吗？',
  '证据标注可信吗？',
];

const EN_12X_MARKERS = [
  'outcome overview',
  'Regenerate one turn',
  'continue',
  'Without uploads',
  'Can I revise the outcome?',
  'How trustworthy are evidence tags?',
];

describe('landingPages', () => {
  test('landing version matches package.json', () => {
    expect(LANDING_SITE.zh.version).toBe(packageVersion);
    expect(LANDING_SITE.en.version).toBe(packageVersion);
    expect(packageVersion).toBe('1.2.5');
  });

  test('RELEASE_NOTES includes 1.2.5 landing alignment', () => {
    const release = RELEASE_NOTES.find((r) => r.version === '1.2.5');
    expect(release).toBeDefined();
    expect(release.highlights.join(' ')).toMatch(/官网文案|landing/i);
    expect(release.highlights.join(' ')).toMatch(/结果一览/);
  });

  test('zh home and workflow mention 1.2.x capabilities', () => {
    const blob = [
      LANDING_SITE.zh.home.deck,
      ...LANDING_SITE.zh.workflow.steps.map((s) => s.join(' ')),
      ...LANDING_SITE.zh.workflow.artifacts,
      ...LANDING_SITE.zh.faq.items.map((item) => item.join(' ')),
      LANDING_SITE.zh.scenarios.items[2].fit,
    ].join('\n');

    for (const marker of ZH_12X_MARKERS) {
      expect(blob).toContain(marker);
    }
  });

  test('en home and workflow mention 1.2.x capabilities', () => {
    const blob = [
      LANDING_SITE.en.home.deck,
      ...LANDING_SITE.en.workflow.steps.map((s) => s.join(' ')),
      ...LANDING_SITE.en.workflow.artifacts,
      ...LANDING_SITE.en.faq.items.map((item) => item.join(' ')),
      LANDING_SITE.en.scenarios.items[2].fit,
    ].join('\n');

    for (const marker of EN_12X_MARKERS) {
      expect(blob).toContain(marker);
    }
  });
});