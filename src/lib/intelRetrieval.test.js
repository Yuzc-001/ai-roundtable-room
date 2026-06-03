import { describe, expect, test } from 'vitest';
import { retrieveIntelChunks } from './intelRetrieval.js';
import { createIntelDocument } from './intelDocuments.js';

describe('retrieveIntelChunks', () => {
  test('ranks chunks by keyword overlap', () => {
    const doc = createIntelDocument({
      title: 'PRD',
      text: '预算上限为五十万元。合规审查必须在两周内完成。',
    });
    const hits = retrieveIntelChunks([doc], '预算与合规风险', 4);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].docTitle).toBe('PRD');
  });
});