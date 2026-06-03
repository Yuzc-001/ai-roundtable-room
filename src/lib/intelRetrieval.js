/**
 * 关键词检索 MVP — 从项目情报库选取与议题相关的段落
 */

function tokenize(text) {
  const t = String(text ?? '').toLowerCase();
  const zhSegs = t.match(/[\u4e00-\u9fff]+/g) || [];
  const zh = [];
  for (const seg of zhSegs) {
    if (seg.length <= 4) zh.push(seg);
    else {
      for (let i = 0; i <= seg.length - 2; i += 1) {
        zh.push(seg.slice(i, i + 2));
      }
    }
  }
  const en = t.match(/[a-z0-9]{3,}/g) || [];
  return [...new Set([...zh, ...en])];
}

function scoreChunk(chunk, queryTokens) {
  const hay = String(chunk.text ?? '').toLowerCase();
  let score = 0;
  for (const tok of queryTokens) {
    if (hay.includes(tok)) score += tok.length >= 4 ? 2 : 1;
  }
  return score;
}

/**
 * @param {object[]} documents - intel documents with chunks
 * @param {string} query - topic + context
 * @param {number} topK
 */
export function retrieveIntelChunks(documents = [], query = '', topK = 8) {
  const queryTokens = tokenize(query);
  if (!queryTokens.length) return [];

  const ranked = [];
  for (const doc of documents) {
    for (const chunk of doc.chunks ?? []) {
      const score = scoreChunk(chunk, queryTokens);
      if (score > 0) {
        ranked.push({
          docId: doc.id,
          docTitle: doc.title,
          chunkId: chunk.id,
          text: chunk.text,
          score,
          source: doc.source,
        });
      }
    }
  }

  return ranked
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export function formatRetrievedIntelBlock(hits = []) {
  if (!hits.length) return '';
  return hits.map((h, i) => (
    `[情报${i + 1}·${h.docTitle}] ${h.text}`
  )).join('\n\n');
}

export function hitsToEvidenceItems(hits = []) {
  return hits.map((h, index) => ({
    id: `intel-${h.docId}-${index}`,
    claim: h.text.slice(0, 180),
    source: `${h.source} · ${h.docTitle}`,
    verificationStatus: 'partial',
    meta: { docId: h.docId, chunkId: h.chunkId, excerpt: h.text },
  }));
}