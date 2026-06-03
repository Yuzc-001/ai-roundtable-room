export const ACT_LABELS = {
  CLAIM: '主张',
  EVIDENCE: '证据',
  OBJECTION: '异议',
  REFINE: '精炼',
  CONCEDE: '让步',
  RESERVE: '保留',
  ANALOGY: '类比',
  EMPATHY: '共情',
  PROBE: '探询',
  META: '元治理',
};

export const EVIDENCE_LABELS = {
  fact: '事实',
  inference: '推断',
  assumption: '假设',
  opinion: '观点',
  project_memory: '项目记忆',
  user_input: '用户输入',
};

export const EVIDENCE_TOOLTIPS = {
  fact: '可核对的事实陈述',
  inference: '由事实推导，尚未独立验证',
  assumption: '审议中的前提，待验证',
  opinion: '立场性判断，非客观事实',
  project_memory: '来自已批准的项目记忆',
  user_input: '来自你提供的议题或材料',
};

export const STANCE_SHORT = { for: '支持', against: '质疑', neutral: '观察' };

export const STANCE_FULL = {
  for: '支持战略',
  against: '持审慎异议',
  neutral: '客观观察',
};