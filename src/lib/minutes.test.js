import { describe, expect, test } from 'vitest';
import {
  formatDecisionTypeLabel,
  formatMeetingHTML,
  formatMeetingMarkdown,
  isSafeCitationUrl,
  sanitizeCssColor,
  sanitizeDownloadName,
} from './minutes.js';

describe('minutes helpers', () => {
  test('formats a meeting as markdown', () => {
    const markdown = formatMeetingMarkdown({
      topic: '如何上线？',
      personas: { du: { name: '渡', title: '主持·哲学引导者' } },
      contextNotes: ['预算有限'],
      providerLabel: 'OpenAI · gpt-5.5',
      meetingSource: 'live',
      generatedAt: '2026-05-17T10:00:00.000Z',
      meeting: {
        title: '上线评审',
        turns: [{ speaker: 'du', text: '先收束范围。', citations: [{ label: '用户访谈', url: 'https://example.com/interview' }] }],
        vote: { question: '是否推进？', results: { du: { vote: 'yes', reason: '可控' } }, summary: '推进' },
        risks: [{ issue: '成本', mitigation: '限流' }],
        actions: ['配置环境变量'],
      },
    });

    expect(markdown).toContain('# 上线评审');
    expect(markdown).toContain('议题：如何上线？');
    expect(markdown).toContain('生成来源：真实生成');
    expect(markdown).toContain('模型：OpenAI · gpt-5.5');
    expect(markdown).toContain('生成时间：2026-05-17T10:00:00.000Z');
    expect(markdown).toContain('- 预算有限');
    expect(markdown).toContain('### 渡｜主持·哲学引导者');
    expect(markdown).toContain('- [用户访谈](https://example.com/interview)');
    expect(markdown).toContain('- 成本：限流');
  });

  test('sanitizes filenames for distribution downloads', () => {
    expect(sanitizeDownloadName('AI/圆桌:会议*纪要?')).toBe('AI-圆桌-会议-纪要-');
  });

  test('omits unsafe citation URLs from markdown', () => {
    const markdown = formatMeetingMarkdown({
      topic: 't',
      personas: { du: { name: '渡', title: '' } },
      meeting: {
        title: 'm',
        turns: [{
          speaker: 'du',
          text: 'x',
          citations: [
            { label: 'bad', url: 'javascript:alert(1)' },
            { label: 'ok', url: 'https://example.com/a' },
          ],
        }],
        vote: { question: 'q', results: {}, summary: 's' },
        risks: [],
        actions: [],
      },
    });
    expect(markdown).not.toContain('javascript:');
    expect(markdown).toContain('[ok](https://example.com/a)');
    expect(markdown).toContain('- bad');
  });

  test('markdown vote uses label map only, never raw poisoned vote enum', () => {
    const markdown = formatMeetingMarkdown({
      topic: 't',
      personas: { du: { name: '渡', title: '' } },
      meeting: {
        title: 'm',
        turns: [{ speaker: 'du', text: 'x' }],
        vote: {
          question: 'q',
          results: { du: { vote: 'yes"><script>', reason: 'r' } },
          summary: 's',
        },
        risks: [],
        actions: [],
        decisionPacket: {
          decisionType: 'conditional',
          selectedOption: { description: 'd', rationale: 'r', confidence: 0.5 },
          residualObjections: [],
          minorityReport: { position: '' },
          reopenConditions: [],
        },
      },
    });
    expect(markdown).toContain('未知');
    expect(markdown).not.toContain('yes"><script>');
    expect(markdown).toContain('附条件共识');
    expect(formatDecisionTypeLabel('conditional')).toBe('附条件共识');
  });

  test('sanitizeCssColor rejects breakout payloads', () => {
    expect(sanitizeCssColor('#fff;}</style><script>')).toBe('#666666');
    expect(sanitizeCssColor('#2E4D44')).toBe('#2E4D44');
  });

  test('formatMeetingHTML blocks attribute injection and script in poisoned share data', () => {
    const html = formatMeetingHTML({
      topic: '议题',
      personas: {
        evil: { name: 'E', title: '', color: '#000;}</style><script>alert(1)</script><style>' },
        du: { name: '渡', title: '', color: '#2E4D44' },
      },
      meeting: {
        title: '毒化纪要',
        turns: [{
          speaker: 'evil',
          text: '正文',
          act: '"><img src=x onerror=alert(1)>',
          phase: 'Frame',
        }],
        vote: {
          question: '是否推进？',
          results: {
            evil: {
              vote: 'yes"><img src=x onerror=alert(1)><span class="',
              reason: '理由',
            },
          },
          summary: '摘要',
        },
        workspace: {
          tensions: [{
            id: 't1',
            description: '分歧',
            status: 'open"><img src=x onerror=alert(1)><span class="',
          }],
          openQuestions: [],
          evidencePool: [],
          candidateOptions: [],
        },
        risks: [],
        actions: [],
      },
    });
    expect(html).not.toMatch(/<img src=x onerror=/i);
    expect(html).not.toContain('<img src=x onerror=alert(1)>');
    expect(html).not.toContain('class="open"><img');
    expect(html).toContain('class="unknown"');
    expect(html).toContain('v-vote unknown');
    expect(isSafeCitationUrl('javascript:x')).toBe(false);
    expect(html).toContain('id="evidence-matrix"');
  });
});
