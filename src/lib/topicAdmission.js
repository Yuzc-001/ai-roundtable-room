/**
 * 1.5.0 议题准入：判断是否值得开圆桌（非硬性拦截，供 UI 与 API 劝退）
 */

import { assessTopic } from './topicCoach.js';

const FACT_QUERY = /^(什么是|什么叫|介绍一下|介绍|定义|解释|帮我写|写一|翻译|润色|改写|摘要|总结这篇)/;
const SIMPLE_TASK = /^(请|帮我)?(查|搜|找|列|列个|给出|输出)(?!.*(是否|如何|权衡|风险|决策))/;
const DECISION_SIGNAL = /是否|如何|该不该|应不应该|要不要|取舍|权衡|风险|假设|反对|路径|决策|方案|优先级|投入|验证|约束/;

export function assessTopicAdmission(topic, { forceRoundtable = false } = {}) {
  const base = assessTopic(topic);
  const t = String(topic ?? '').trim();

  if (!t.length) {
    return {
      ...base,
      verdict: 'idle',
      fit: 'unknown',
      headline: '请先输入议题',
      rationale: [],
      suggestRoundtable: false,
      suggestSingleModel: false,
      requiresConfirm: false,
    };
  }

  const reasons = [];
  let fit = 'roundtable_recommended';

  if (FACT_QUERY.test(t)) {
    fit = 'single_model_better';
    reasons.push('更像事实查询或文案任务，单模型通常更快更准');
  } else if (SIMPLE_TASK.test(t) && !DECISION_SIGNAL.test(t)) {
    fit = 'single_model_better';
    reasons.push('指令偏执行型，缺少待决权衡，圆桌收益有限');
  } else if (t.length < 12) {
    fit = 'borderline';
    reasons.push('议题过短，难以组织多视角碰撞');
  } else if (!DECISION_SIGNAL.test(t) && t.length < 40) {
    fit = 'borderline';
    reasons.push('未体现决策/权衡/风险，建议补充后再开圆桌');
  } else if (base.warnings.length) {
    fit = 'borderline';
    reasons.push(...base.warnings);
  } else {
    reasons.push('议题含决策张力，适合多判断函数审议');
  }

  if (forceRoundtable) fit = 'roundtable_recommended';

  const suggestSingleModel = fit === 'single_model_better';
  const suggestRoundtable = fit === 'roundtable_recommended';
  const requiresConfirm = fit !== 'roundtable_recommended' && !forceRoundtable;

  const headlines = {
    roundtable_recommended: '适合开圆桌',
    single_model_better: '建议先用单模型',
    borderline: '可开圆桌，但建议先补强议题',
    idle: '待输入',
  };

  return {
    ...base,
    verdict: fit,
    fit,
    headline: headlines[fit] || headlines.borderline,
    rationale: reasons,
    suggestRoundtable,
    suggestSingleModel,
    requiresConfirm,
  };
}