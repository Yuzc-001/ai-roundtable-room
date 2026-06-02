import { describe, expect, test } from 'vitest';
import { enforceMeetingEvidence, enforceTurnEvidence, extractUserEvidenceAnchors } from './evidence.js';

describe('extractUserEvidenceAnchors', () => {
  test('collects urls from topic and context', () => {
    const anchors = extractUserEvidenceAnchors({
      topic: '见 https://example.com/a',
      context: '补充 https://example.com/b',
    });
    expect(anchors.hasUserMaterial).toBe(true);
    expect(anchors.urls.size).toBe(2);
  });
});

describe('enforceTurnEvidence', () => {
  test('strips external urls when user provided no material', () => {
    const turn = enforceTurnEvidence({
      text: '声称有论文支持',
      evidenceLabel: 'fact',
      citations: [{ label: '假论文', url: 'https://evil.example/paper' }],
    }, extractUserEvidenceAnchors({ topic: '短议题' }));

    expect(turn.evidenceLabel).toBe('inference');
    expect(turn.citations).toEqual([{ label: '假论文' }]);
  });

  test('keeps urls that appear in user context', () => {
    const anchors = extractUserEvidenceAnchors({
      topic: '依据 https://example.com/report 判断',
    });
    const turn = enforceTurnEvidence({
      text: '引用报告',
      evidenceLabel: 'fact',
      citations: [{ label: '报告', url: 'https://example.com/report' }],
    }, anchors);

    expect(turn.evidenceLabel).toBe('fact');
    expect(turn.citations[0].url).toBe('https://example.com/report');
  });
});

describe('enforceMeetingEvidence', () => {
  test('applies policy to every turn', () => {
    const meeting = enforceMeetingEvidence({
      turns: [
        { speaker: 'du', text: 'a', evidenceLabel: 'fact', citations: [{ label: 'x', url: 'https://x.com' }] },
        { speaker: 'li', text: 'b', evidenceLabel: 'fact', citations: [] },
      ],
    }, { topic: '测试', context: '' });

    expect(meeting.turns[0].evidenceLabel).toBe('inference');
    expect(meeting.turns[1].evidenceLabel).toBe('inference');
  });
});