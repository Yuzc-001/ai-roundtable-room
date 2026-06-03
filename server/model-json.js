export function parseModelJson(text) {
  const raw = String(text ?? '').trim();
  if (!raw) throw new Error('模型没有返回内容');
  try {
    return JSON.parse(raw);
  } catch {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) return JSON.parse(fenced[1].trim());
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(raw.slice(start, end + 1));
    throw new Error('模型没有返回可解析的 JSON');
  }
}