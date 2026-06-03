import { describe, expect, test } from 'vitest';
import { buildContinueSuggestions } from './continueSuggestions.js';

describe('buildContinueSuggestions', () => {
  test('uses open questions first', () => {
    const suggestions = buildContinueSuggestions({
      workspace: { openQuestions: [{ question: '定价边界在哪？' }] },
    });
    expect(suggestions[0]).toContain('定价边界');
  });

  test('falls back to generic prompts', () => {
    const suggestions = buildContinueSuggestions({ workspace: {} });
    expect(suggestions.length).toBeGreaterThanOrEqual(1);
  });
});