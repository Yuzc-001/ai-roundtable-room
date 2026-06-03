import { describe, expect, test } from 'vitest';
import {
  aggregatePeerRankings,
  buildCouncilAuditTrail,
  lengthAdjustedScore,
  shouldUseCognitiveCouncil,
} from './cognitive-council.js';

describe('lengthAdjustedScore', () => {
  test('penalizes very long answers at same raw score', () => {
    const short = lengthAdjustedScore(8, 150);
    const long = lengthAdjustedScore(8, 900);
    expect(short).toBeGreaterThan(long);
  });
});

describe('aggregatePeerRankings', () => {
  test('aggregates blind reviews with length correction', () => {
    const opinions = [
      { anonymousId: 'A', speakerId: 'zhuo', text: '短答' },
      { anonymousId: 'B', speakerId: 'li', text: 'x'.repeat(800) },
    ];
    const reviews = [
      {
        reviewerId: 'heng',
        rankings: [
          { anonymousId: 'B', score: 8, rationale: '详细' },
          { anonymousId: 'A', score: 9, rationale: '简洁' },
        ],
      },
    ];
    const ranked = aggregatePeerRankings(reviews, opinions);
    expect(ranked[0].anonymousId).toBe('A');
  });
});

describe('shouldUseCognitiveCouncil', () => {
  test('enabled by default for multi provider', () => {
    expect(shouldUseCognitiveCouncil({ providers: { a: {}, b: {} } }, {})).toBe(true);
  });

  test('disabled for single provider unless forced', () => {
    expect(shouldUseCognitiveCouncil({ providers: { a: {} } }, {})).toBe(false);
    expect(shouldUseCognitiveCouncil({ providers: { a: {} } }, { enabled: true })).toBe(true);
  });
});

describe('buildCouncilAuditTrail', () => {
  test('includes challenge edges', () => {
    const audit = buildCouncilAuditTrail({
      stage1: [{ anonymousId: 'A', speakerId: 'zhuo', text: 'a' }],
      stage2: [],
      peerRanking: [
        { anonymousId: 'A', speakerId: 'zhuo', totalScore: 10 },
        { anonymousId: 'B', speakerId: 'li', totalScore: 5 },
      ],
      challenges: [{ challenger: 'li', target: 'zhuo' }],
    });
    expect(audit.version).toBe('1.4');
    expect(audit.challenges).toHaveLength(1);
  });
});