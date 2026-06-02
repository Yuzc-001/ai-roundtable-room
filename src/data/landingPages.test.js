import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import {
  getLocalizedReleaseNotes,
  LANDING_SITE,
  RELEASE_NOTES,
} from './landingPages.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const packageVersion = JSON.parse(
  readFileSync(join(root, 'package.json'), 'utf8'),
).version;

const ZH_12X_MARKERS = [
  '结果一览',
  '可对单轮发言重生成',
  '再手动重算',
  '继续审议',
  '无上传材料时不保留无源外链',
  '审议结果可以改吗？',
  '证据标注可信吗？',
  '项目记忆',
];

const EN_12X_MARKERS = [
  'outcome overview',
  'a single turn can be regenerated',
  'manually recalculate',
  '→ continue deliberation →',
  'Without uploads',
  'Can I revise the outcome?',
  'How trustworthy are evidence tags?',
  'project memory',
];

describe('landingPages', () => {
  test('landing version matches package.json', () => {
    expect(LANDING_SITE.zh.version).toBe(packageVersion);
    expect(LANDING_SITE.en.version).toBe(packageVersion);
    expect(RELEASE_NOTES[0].version).toBe(packageVersion);
  });

  test('RELEASE_NOTES includes current version with EN highlights', () => {
    const release = RELEASE_NOTES.find((r) => r.version === packageVersion);
    expect(release).toBeDefined();
    expect(release.highlights.join(' ')).toMatch(/议事厅|五级按钮|发起审议|侧栏分组/i);
    expect(release.highlightsEn?.length).toBeGreaterThanOrEqual(3);
    const enFirst = getLocalizedReleaseNotes('en')[0].highlights.join(' ');
    expect(enFirst).toMatch(/Archival UI|five-level button|Start deliberation/i);
    expect(enFirst).not.toMatch(/官网文案/);
  });

  test('zh/en structural parity', () => {
    expect(LANDING_SITE.zh.faq.items.length).toBe(LANDING_SITE.en.faq.items.length);
    expect(LANDING_SITE.zh.workflow.steps.length).toBe(LANDING_SITE.en.workflow.steps.length);
    expect(LANDING_SITE.zh.workflow.artifacts.length).toBe(
      LANDING_SITE.en.workflow.artifacts.length,
    );
    expect(LANDING_SITE.zh.scenarios.items.length).toBe(LANDING_SITE.en.scenarios.items.length);
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
    expect(LANDING_SITE.zh.home.deck).not.toMatch(/重生成并重算/);
    expect(LANDING_SITE.zh.home.deck).toContain('证据矩阵');
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
    expect(LANDING_SITE.en.home.deck).not.toMatch(/any turn/i);
    expect(LANDING_SITE.en.home.deck).toMatch(/evidence matrix/i);
  });
});