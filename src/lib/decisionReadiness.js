/**
 * 1.5 决策就绪 — 合并议题准入、教练与发起前检查为单一模型
 */

import { assessTopic } from './topicCoach.js';
import { assessTopicAdmission } from './topicAdmission.js';

const FIT_SCORE = {
  roundtable_recommended: 92,
  borderline: 58,
  single_model_better: 28,
  unknown: 0,
};

export function buildDecisionReadiness({
  topic = '',
  health = null,
  scenarioName = '',
  taskTitle = '',
  memoryEnabled = true,
  admissionOverride = false,
  intelSelectedCount = 0,
  phaseCount = 5,
} = {}) {
  const admission = assessTopicAdmission(topic, { forceRoundtable: admissionOverride });
  const coach = assessTopic(topic);
  const topicOk = admissionOverride
    || coach.level === 'ok'
    || (coach.level === 'hint' && !coach.warnings.length);
  const apiOk = health?.aiConfigured === true;
  const hasTopic = Boolean(String(topic).trim());

  let score = hasTopic ? FIT_SCORE[admission.fit] ?? 40 : 0;
  if (topicOk) score = Math.min(100, score + 6);
  if (apiOk) score = Math.min(100, score + 4);
  if (intelSelectedCount > 0) score = Math.min(100, score + 8);
  if (scenarioName) score = Math.min(100, score + 3);
  if (admissionOverride && admission.fit !== 'roundtable_recommended') score = Math.max(score, 72);

  const checks = [
    {
      id: 'topic',
      label: topicOk ? '议题表述可支撑多视角讨论' : '议题偏空或需写清决策背景',
      ok: topicOk,
      required: true,
    },
    {
      id: 'admission',
      label: admission.headline,
      detail: admission.rationale[0],
      ok: admission.fit === 'roundtable_recommended' || admissionOverride,
      required: true,
    },
    {
      id: 'api',
      label: apiOk ? '已连接模型，可生成真实审议' : '演示模式（配置 API Key 后可真实生成）',
      ok: apiOk,
      required: false,
    },
    {
      id: 'scenario',
      label: scenarioName ? `审议场景：${scenarioName}` : '未选场景（将使用默认席位）',
      ok: Boolean(scenarioName),
      required: false,
    },
    {
      id: 'intel',
      label: intelSelectedCount > 0
        ? `已选 ${intelSelectedCount} 份项目材料参与检索`
        : '未选项目材料（可选，建议决策类议题入库证据）',
      ok: intelSelectedCount > 0,
      required: false,
    },
    {
      id: 'memory',
      label: `项目记忆${memoryEnabled ? '已开启' : '已关闭'} · 约 ${phaseCount} 阶段`,
      ok: true,
      required: false,
    },
  ];

  if (taskTitle) {
    checks.splice(4, 0, {
      id: 'task',
      label: `绑定任务：${taskTitle}`,
      ok: true,
      required: false,
    });
  }

  const requiredOk = checks.filter((c) => c.required).every((c) => c.ok);
  const canStart = hasTopic && requiredOk && (apiOk || health?.aiConfigured === false);

  const evidenceNeed = /证据|数据|指标|验证|假设/.test(topic) || intelSelectedCount > 0
    ? 'high'
    : /是否|权衡|风险/.test(topic)
      ? 'medium'
      : 'low';

  return {
    admission,
    coach,
    checks,
    score,
    canStart,
    evidenceNeed,
    suggestSingleModel: admission.suggestSingleModel && !admissionOverride,
    requiresConfirm: admission.requiresConfirm,
  };
}