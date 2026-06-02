import { describe, expect, test } from 'vitest';
import {
  buildEvidenceMatrixRows,
  formatEvidenceMatrixHTML,
  formatEvidenceMatrixMarkdown,
} from './evidenceMatrix.js';
import { formatMeetingHTML } from './minutes.js';

const PERSONAS = { du: { name: '渡', title: '' }, zhuo: { name: '灼', title: '' } };

const SAMPLE_MEETING = {
  title: '测试会议',
  turns: [
    {
      speaker: 'du',
      phase: 'Frame',
      act: 'PROBE',
      evidenceLabel: 'inference',
      confidence: 0.72,
      text: '先拆清问题边界，再进入证据对照。',
      citations: [{ label: '用户访谈', url: 'https://example.com/a' }],
    },
    {
      speaker: 'zhuo',
      phase: 'Diverge',
      act: 'CLAIM',
      evidenceLabel: 'assumption',
      confidence: 0.5,
      text: '主张应附带可验证指标。',
      citations: [{ label: '恶意', url: 'javascript:alert(1)' }],
    },
  ],
  workspace: {
    evidencePool: [
      {
        id: 'ev-1',
        claim: '需要真实用户验证',
        source: '模型推断',
        verificationStatus: 'assumption',
      },
    ],
  },
};

describe('evidenceMatrix', () => {
  test('buildEvidenceMatrixRows includes turns and evidence pool', () => {
    const rows = buildEvidenceMatrixRows(SAMPLE_MEETING, PERSONAS);
    expect(rows).toHaveLength(3);
    expect(rows[0].speaker).toBe('渡');
    expect(rows[0].excerpt.length).toBeLessThanOrEqual(81);
    expect(rows[2].kind).toBe('pool');
    expect(rows[2].speaker).toBe('证据池');
  });

  test('formatEvidenceMatrixHTML escapes XSS and uses safe verification classes', () => {
    const html = formatEvidenceMatrixHTML({
      topic: '议题"><script>',
      meeting: {
        title: 't',
        turns: [{
          speaker: 'evil',
          phase: 'Frame',
          act: 'CLAIM',
          evidenceLabel: 'fact',
          confidence: 0.9,
          text: '<img src=x onerror=alert(1)>',
          citations: [],
        }],
        workspace: {
          evidencePool: [{
            id: 'x',
            claim: 'claim',
            source: 'src',
            verificationStatus: 'open"><img src=x onerror=alert(1)>',
          }],
        },
      },
      personas: { evil: { name: 'E<img>', title: '' } },
    });
    expect(html).toContain('id="evidence-matrix"');
    expect(html).not.toMatch(/<img src=x onerror=/i);
    expect(html).toContain('class="ev-unknown"');
    expect(html).not.toContain('open"><img');
  });

  test('formatMeetingHTML embeds evidence-matrix section', () => {
    const html = formatMeetingHTML({
      topic: '如何上线',
      personas: PERSONAS,
      meeting: SAMPLE_MEETING,
      vote: { question: 'q', results: {}, summary: 's' },
    });
    expect(html).toContain('id="evidence-matrix"');
    expect(html).toContain('证据矩阵');
  });

  test('formatEvidenceMatrixMarkdown renders table rows', () => {
    const md = formatEvidenceMatrixMarkdown({
      topic: '议题',
      meeting: SAMPLE_MEETING,
      personas: PERSONAS,
      generatedAt: '2026-06-02T10:00:00.000Z',
    });
    expect(md).toContain('## 证据矩阵');
    expect(md).toContain('| 发言 | 渡 |');
    expect(md).not.toContain('javascript:');
  });
});