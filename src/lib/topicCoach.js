/**
 * Live topic quality hints — helps users shape deliberation-ready questions.
 * @param {string} text
 * @returns {{ level: 'idle'|'ok'|'hint'|'warn', charCount: number, tips: string[], warnings: string[] }}
 */
export function assessTopic(text) {
  const t = String(text ?? '').trim();
  const tips = [];
  const warnings = [];

  if (!t.length) {
    return { level: 'idle', charCount: 0, tips: [], warnings: [] };
  }

  if (t.length < 12) {
    tips.push('议题偏短：建议写清背景、约束与待决问题（2–4 句）');
  } else if (t.length < 28) {
    tips.push('可补充「在…约束下，是否/如何…」让审议边界更清晰');
  }

  if (!/[？?]/.test(t) && t.length >= 10) {
    tips.push('决策类议题建议以问句收束（是否 / 如何 / 什么）');
  }

  if (
    t.length >= 16
    && !/权衡|风险|证据|是否|如何|应该|取舍|验证|约束|假设|反对|路径|决策/.test(t)
  ) {
    tips.push('圆桌适合含权衡、假设或待验证条件的表述，而非单纯描述');
  }

  if (/^(什么是|介绍一下|帮我写|翻译|润色)/.test(t)) {
    warnings.push('更像事实查询或文案任务 — 单模型可能更合适');
  }
  if (/^请(你|您)?(直接|简单)/.test(t) && !/是否|如何|权衡/.test(t)) {
    warnings.push('指令式短句缺少待决权衡，审议价值可能有限');
  }

  let level = 'ok';
  if (warnings.length) level = 'warn';
  else if (tips.length) level = 'hint';

  return { level, charCount: t.length, tips, warnings };
}