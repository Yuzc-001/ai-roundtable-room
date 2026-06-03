/**
 * 1.4.2 情报接入：URL / 文本片段 → evidence pool 条目（无需 LLM）
 */

const MAX_URL_BYTES = 120_000;
const MAX_SNIPPET_LEN = 4000;
const FETCH_TIMEOUT_MS = 12_000;

function makeEvidenceId() {
  return `intel-${Math.random().toString(36).slice(2, 8)}`;
}

function stripHtml(html) {
  return String(html ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function fetchUrlText(url, { fetchImpl = fetch } = {}) {
  const parsed = new URL(url);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('仅支持 http/https 链接');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetchImpl(url, {
      signal: controller.signal,
      headers: { 'user-agent': 'AI-Roundtable-Room/1.4 IntelBot' },
      redirect: 'follow',
    });
    if (!response.ok) {
      throw new Error(`抓取失败 (${response.status})`);
    }
    const buf = await response.arrayBuffer();
    if (buf.byteLength > MAX_URL_BYTES) {
      throw new Error('页面过大，请改为上传 PDF 或粘贴摘要');
    }
    const raw = new TextDecoder('utf-8', { fatal: false }).decode(buf);
    const text = stripHtml(raw).slice(0, MAX_SNIPPET_LEN);
    if (text.length < 40) {
      throw new Error('未能从页面提取有效正文');
    }
    return { url: parsed.href, text, title: parsed.hostname };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @param {{ urls?: string[], snippets?: { title?: string, text: string }[] }} input
 */
export async function ingestIntelligence(input = {}, { fetchImpl = fetch } = {}) {
  const items = [];
  const errors = [];

  for (const rawUrl of input.urls ?? []) {
    const url = String(rawUrl ?? '').trim();
    if (!url) continue;
    try {
      const fetched = await fetchUrlText(url, { fetchImpl });
      items.push({
        id: makeEvidenceId(),
        claim: fetched.text.slice(0, 180),
        source: `网页：${fetched.title}`,
        verificationStatus: 'partial',
        meta: { kind: 'url', url: fetched.url, excerpt: fetched.text.slice(0, 800) },
      });
    } catch (error) {
      errors.push({ url, error: error.message });
    }
  }

  for (const snippet of input.snippets ?? []) {
    const text = String(snippet?.text ?? '').trim();
    if (!text) continue;
    items.push({
      id: makeEvidenceId(),
      claim: text.slice(0, 180),
      source: snippet.title ? `用户材料：${snippet.title}` : '用户粘贴材料',
      verificationStatus: 'verified',
      meta: { kind: 'snippet', excerpt: text.slice(0, MAX_SNIPPET_LEN) },
    });
  }

  return { items: items.slice(0, 12), errors };
}

export function mergeIntelligenceIntoContext(context = '', items = []) {
  if (!items.length) return context;
  const block = items.map((item, index) => (
    `[情报${index + 1}] ${item.source}\n${item.meta?.excerpt || item.claim}`
  )).join('\n\n');
  return [context, '[用户情报材料]', block].filter(Boolean).join('\n\n');
}

export function seedWorkspaceEvidence(pool = [], intelItems = []) {
  const next = [...pool];
  for (const item of intelItems) {
    if (next.length >= 12) break;
    if (next.some((e) => e.id === item.id)) continue;
    next.push({
      id: item.id,
      claim: item.claim,
      source: item.source,
      verificationStatus: item.verificationStatus,
    });
  }
  return next;
}

export function formatIntelligenceContextBlock(items = []) {
  return mergeIntelligenceIntoContext('', items);
}