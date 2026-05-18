import { describe, expect, test } from 'vitest';
import { formatMeetingMarkdown, sanitizeDownloadName } from './minutes.js';

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
});
