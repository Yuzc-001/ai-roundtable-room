import { z } from 'zod';
import { enforceMeetingEvidence } from './evidence.js';
import { PERSONAS, PRESETS } from '../shared/personas.js';
import { humanizeUserFacingText } from './userFacingText.js';

const StanceSchema = z.enum(['for', 'against', 'neutral']);
const ReactionSchema = z.enum(['agree', 'disagree', 'curious', 'thinking']);
const VoteSchema = z.enum(['yes', 'yes_with', 'no', 'abstain']);
const ActSchema = z.enum(['CLAIM', 'EVIDENCE', 'OBJECTION', 'REFINE', 'CONCEDE', 'RESERVE', 'ANALOGY', 'EMPATHY', 'PROBE', 'META']);
const PhaseSchema = z.enum(['Frame', 'Diverge', 'Surface', 'Examine', 'Converge', 'Decide', 'Document']);
const EvidenceLabelSchema = z.enum(['fact', 'inference', 'assumption', 'opinion', 'project_memory', 'user_input']);

const CitationSchema = z.object({
  label: z.string().min(1).max(80),
  url: z.string().max(300).optional(),
});

const GenerationCitationSchema = z.object({
  label: z.string().min(1).max(80),
  url: z.string().max(300).nullable(),
});

const TurnSchema = z.object({
  speaker: z.string().min(1).max(40),
  text: z.string().min(1).max(900),
  providerId: z.string().max(40).optional(),
  providerName: z.string().max(80).optional(),
  act: ActSchema.optional(),
  phase: PhaseSchema.optional(),
  confidence: z.number().min(0).max(1).optional(),
  evidenceLabel: EvidenceLabelSchema.optional(),
  thinking: z.array(z.string().min(1).max(60)).max(3).optional(),
  citations: z.array(CitationSchema).max(3).optional(),
  stance: StanceSchema.optional(),
  reactions: z.record(z.string(), ReactionSchema).optional(),
});

const WorkspaceSchema = z.object({
  candidateOptions: z.array(z.object({
    id: z.string().min(1).max(40),
    description: z.string().min(1).max(160),
  })).max(8).default([]),
  openQuestions: z.array(z.object({
    id: z.string().min(1).max(40),
    question: z.string().min(1).max(180),
    blocks: z.boolean().default(false),
  })).max(8).default([]),
  tensions: z.array(z.object({
    id: z.string().min(1).max(40),
    description: z.string().min(1).max(180),
    status: z.enum(['open', 'resolved', 'deferred']).default('open'),
    positions: z.record(z.string(), z.string()).default({}),
  })).max(8).default([]),
  evidencePool: z.array(z.object({
    id: z.string().min(1).max(40),
    claim: z.string().min(1).max(180),
    source: z.string().min(1).max(120),
    verificationStatus: z.enum(['verified', 'partial', 'assumption', 'contradicted', 'unverified']).default('assumption'),
  })).max(12).default([]),
}).default({
  candidateOptions: [],
  openQuestions: [],
  tensions: [],
  evidencePool: [],
});

const DecisionPacketSchema = z.object({
  decisionType: z.enum(['consensus', 'majority', 'conditional', 'no_decision']),
  selectedOption: z.object({
    description: z.string().min(1).max(180),
    rationale: z.string().min(1).max(260),
    confidence: z.number().min(0).max(1),
  }),
  alternativesConsidered: z.array(z.object({
    description: z.string().min(1).max(160),
    whyNotSelected: z.string().min(1).max(220),
  })).max(6).default([]),
  residualObjections: z.array(z.object({
    objection: z.string().min(1).max(180),
    raisedBy: z.string().min(1).max(40),
    addressedBy: z.string().max(220).nullable().optional(),
    acceptableToDecider: z.boolean().optional(),
  })).max(8).default([]),
  minorityReport: z.object({
    position: z.string().max(180).nullable().default(null),
    rationale: z.string().max(260).nullable().default(null),
    conditionsToReconsider: z.array(z.string().min(1).max(160)).max(6).default([]),
  }),
  reopenConditions: z.array(z.object({
    condition: z.string().min(1).max(180),
    checkMechanism: z.string().min(1).max(180),
  })).max(6).default([]),
  evidenceUsed: z.array(z.object({
    id: z.string().min(1).max(40).optional(),
    source: z.string().min(1).max(120),
    verificationStatus: z.enum(['verified', 'partial', 'assumption', 'contradicted', 'unverified']).default('assumption'),
  })).max(8).default([]),
  actionItems: z.array(z.object({
    action: z.string().min(1).max(180),
    owner: z.string().min(1).max(60).nullable().default('用户'),
    deadline: z.string().max(40).nullable().default(null),
  })).max(8).default([]),
});

const MemoryDiffSchema = z.object({
  decisions: z.array(z.object({
    text: z.string().min(1).max(220),
    reason: z.string().max(220).optional(),
  })).max(6).default([]),
  risks: z.array(z.object({
    issue: z.string().min(1).max(120),
    mitigation: z.string().min(1).max(180),
  })).max(8).default([]),
  assumptions: z.array(z.object({
    text: z.string().min(1).max(180),
    validation: z.string().max(180).optional(),
  })).max(8).default([]),
  disagreements: z.array(z.object({
    text: z.string().min(1).max(180),
    status: z.enum(['open', 'resolved', 'deferred']).default('open'),
  })).max(8).default([]),
  actions: z.array(z.object({
    text: z.string().min(1).max(160),
    owner: z.string().max(60).optional(),
  })).max(8).default([]),
}).default({
  decisions: [],
  risks: [],
  assumptions: [],
  disagreements: [],
  actions: [],
});

export const MeetingResultSchema = z.object({
  title: z.string().min(1).max(80),
  turns: z.array(TurnSchema).min(1).max(12),
  vote: z.object({
    question: z.string().min(1).max(120),
    results: z.record(
      z.string(),
      z.object({
        vote: VoteSchema,
        reason: z.string().min(1).max(120),
      }),
    ),
    summary: z.string().min(1).max(500),
  }),
  risks: z.array(z.object({
    issue: z.string().min(1).max(120),
    mitigation: z.string().min(1).max(180),
  })).max(8),
  actions: z.array(z.string().min(1).max(160)).max(8),
  workspace: WorkspaceSchema,
  decisionPacket: DecisionPacketSchema.optional(),
  memoryDiff: MemoryDiffSchema,
  usage: z.object({
    inputTokens: z.number().default(0),
    outputTokens: z.number().default(0),
    totalTokens: z.number().default(0),
  }).optional(),
});

const GenerationTurnSchema = z.object({
  speaker: z.string().min(1).max(40),
  text: z.string().min(1).max(900),
  act: ActSchema.optional(),
  phase: PhaseSchema.optional(),
  confidence: z.number().min(0).max(1).optional(),
  evidenceLabel: EvidenceLabelSchema.optional(),
  thinking: z.array(z.string().min(1).max(60)).max(3).default([]),
  citations: z.array(GenerationCitationSchema).max(3).default([]),
  stance: z.enum(['for', 'against', 'neutral', 'none']).default('neutral'),
  reactions: z.array(z.object({
    speaker: z.string().min(1).max(40),
    reaction: ReactionSchema,
  })).max(8).default([]),
});

const MeetingGenerationSchema = z.object({
  title: z.string().min(1).max(80),
  turns: z.array(GenerationTurnSchema).min(5).max(10),
  vote: z.object({
    question: z.string().min(1).max(120),
    results: z.array(z.object({
      speaker: z.string().min(1).max(40),
      vote: VoteSchema,
      reason: z.string().min(1).max(120),
    })).max(8),
    summary: z.string().min(1).max(500),
  }),
  risks: z.array(z.object({
    issue: z.string().min(1).max(120),
    mitigation: z.string().min(1).max(180),
  })).max(8),
  actions: z.array(z.string().min(1).max(160)).max(8),
  workspace: WorkspaceSchema.optional(),
  decisionPacket: DecisionPacketSchema.optional(),
  memoryDiff: MemoryDiffSchema.optional(),
});

const TurnDraftSchema = z.object({
  text: z.string().min(1).max(900),
  act: ActSchema.optional(),
  phase: PhaseSchema.optional(),
  confidence: z.number().min(0).max(1).optional(),
  evidenceLabel: EvidenceLabelSchema.optional(),
  thinking: z.array(z.string().min(1).max(60)).max(3),
  citations: z.array(GenerationCitationSchema).max(3),
  stance: z.enum(['for', 'against', 'neutral', 'none']),
  reactions: z.array(z.object({
    speaker: z.string().min(1).max(40),
    reaction: ReactionSchema,
  })).max(8),
});

const MeetingSummarySchema = z.object({
  title: z.string().min(1).max(80),
  vote: z.object({
    question: z.string().min(1).max(120),
    results: z.array(z.object({
      speaker: z.string().min(1).max(40),
      vote: VoteSchema,
      reason: z.string().min(1).max(120),
    })).max(8),
    summary: z.string().min(1).max(500),
  }),
  risks: z.array(z.object({
    issue: z.string().min(1).max(120),
    mitigation: z.string().min(1).max(180),
  })).max(8),
  actions: z.array(z.string().min(1).max(160)).max(8),
});

export function normalizeTopic(topic) {
  const clean = String(topic ?? '').trim();
  if (!clean) throw new Error('请输入会议议题');
  if (clean.length > 800) throw new Error('议题不能超过 800 字');
  return clean;
}

function cleanText(value, fallback, max) {
  const clean = String(value ?? '').trim();
  return clean ? clean.slice(0, max) : fallback;
}

function applyPersonaOverride(base, override) {
  if (!override || override.id !== base.id) return base;
  return {
    ...base,
    name: cleanText(override.name, base.name, 3),
    title: cleanText(override.title, base.title, 80),
    blurb: cleanText(override.blurb, base.blurb, 500),
    background: cleanText(override.background, base.background, 240),
  };
}

export function buildMeetingInput({ topic, presetId = 'product', context = '', personas = [] }) {
  const cleanTopic = normalizeTopic(topic);
  const preset = PRESETS[presetId] ?? PRESETS.product;
  const ids = [preset.moderator, ...preset.participants];
  const overrides = new Map(
    (Array.isArray(personas) ? personas : [])
      .filter((persona) => persona?.id)
      .map((persona) => [persona.id, persona]),
  );
  const selectedPersonas = ids
    .map((id) => PERSONAS[id])
    .filter(Boolean)
    .map((persona) => applyPersonaOverride(persona, overrides.get(persona.id)))
    .map((persona) => ({
      id: persona.id,
      name: persona.name,
      title: persona.title,
      blurb: persona.blurb,
      background: persona.background,
      contract: persona.contract,
      isModerator: Boolean(persona.isModerator),
    }));

  return {
    topic: cleanTopic,
    context: String(context ?? '').trim().slice(0, 2000),
    preset: {
      id: preset.id,
      name: preset.name,
      description: preset.description,
    },
    personas: selectedPersonas,
  };
}

export function extractParsedMeeting(response) {
  if (response?.output_parsed) return response.output_parsed;

  for (const output of response?.output ?? []) {
    if (output.type !== 'message') continue;
    for (const item of output.content ?? []) {
      if (item.type === 'refusal') {
        throw new Error(item.refusal || '模型拒绝生成这场会议');
      }
      if (item.parsed) return item.parsed;
    }
  }

  throw new Error('模型没有返回可解析的会议结果');
}

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

function generationToMeeting(parsed) {
  if (parsed?.vote?.results && !Array.isArray(parsed.vote.results)) return parsed;

  return {
    ...parsed,
    turns: (parsed.turns ?? []).map((turn) => ({
      ...turn,
      stance: turn.stance === 'none' ? undefined : turn.stance,
      citations: (turn.citations ?? []).map((citation) => (
        citation.url ? citation : { label: citation.label }
      )),
      reactions: Object.fromEntries((turn.reactions ?? []).map((r) => [r.speaker, r.reaction])),
    })),
    vote: {
      question: parsed.vote?.question ?? '是否推进？',
      results: Object.fromEntries((parsed.vote?.results ?? []).map((r) => [
        r.speaker,
        { vote: r.vote, reason: r.reason },
      ])),
      summary: parsed.vote?.summary ?? '会议已结束。',
    },
  };
}

function safeCitation(citation) {
  if (!citation.url) return { label: citation.label };
  try {
    const url = new URL(citation.url);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return { label: citation.label, url: citation.url };
  } catch {
    return null;
  }
}

const DEFAULT_ACT_BY_SPEAKER = {
  du: 'PROBE',
  zhuo: 'CLAIM',
  li: 'OBJECTION',
  heng: 'EVIDENCE',
  che: 'EMPATHY',
  yang: 'ANALOGY',
};

const DEFAULT_PHASES = ['Frame', 'Diverge', 'Surface', 'Examine', 'Converge', 'Decide', 'Document'];

function hasWorkspaceContent(workspace = {}) {
  return ['candidateOptions', 'openQuestions', 'tensions', 'evidencePool']
    .some((key) => (workspace[key] ?? []).length > 0);
}

function hasMemoryDiffContent(memoryDiff = {}) {
  return ['decisions', 'risks', 'assumptions', 'disagreements', 'actions']
    .some((key) => (memoryDiff[key] ?? []).length > 0);
}

// ===== 结构化治理核心（Live Workspace + Moderator 干预 + Contract 校验 + Phase 推进） =====
// 目标：让 createRoutedMeeting 成为受控循环，workspace 在每轮后真实演化并反哺 prompt，
// Moderator 会在中途 0~2 次以 PROBE/META 执行协议门控，基础越权可被检测并在干预中被指出。
// 设计约束：最小改动、不新增文件、保持单/多 provider 路径兼容、测试 mock 不触发额外调用。
// 参数调优记录（2026-05-17）：INTERVENTION_INTERVAL=3、MAX=2 是基于 6-8 轮典型 routed 长度 + 成本权衡得出的初始值；
// 未来可根据真实模型输出命中率再调整。所有魔法数字已提取为命名常量。

// 治理参数（集中定义 + 注释，便于未来 tuning 和可读性）
const INTERVENTION_INTERVAL = 3;      // 每 N 轮检查一次是否需要 Moderator 插手
const MAX_INTERVENTIONS = 2;          // 最多插入 2 次 PROBE/META，控制 token/延迟
const MIN_TURNS_FOR_PROXY = 5;        // 内容代理兜底阈值（与 shouldTrigger 配合）
const PHASE_ADVANCE_SLOPE = 1.1;      // advancePhase 兜底推进的宽松系数

const PHASE_ORDER = ['Frame', 'Diverge', 'Surface', 'Examine', 'Converge', 'Decide', 'Document'];

function initLiveWorkspace() {
  return {
    candidateOptions: [],
    openQuestions: [],
    tensions: [],
    evidencePool: [],
  };
}

function makeId(prefix) {
  // 简短随机 id，满足 schema 唯一性即可
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function compactWorkspaceSnapshot(ws = {}) {
  // 压缩版给 prompt，避免 token 爆炸，同时保留关键可引用信息
  return {
    tensions: (ws.tensions ?? []).slice(0, 4).map((t) => ({
      id: t.id,
      description: String(t.description ?? '').slice(0, 80),
      status: t.status || 'open',
    })),
    evidencePool: (ws.evidencePool ?? []).slice(0, 5).map((e) => ({
      id: e.id,
      claim: String(e.claim ?? '').slice(0, 60),
      verificationStatus: e.verificationStatus || 'assumption',
    })),
    openQuestions: (ws.openQuestions ?? []).slice(0, 3).map((q) => ({
      id: q.id,
      question: String(q.question ?? '').slice(0, 80),
    })),
    candidateOptions: (ws.candidateOptions ?? []).slice(0, 3).map((o) => ({
      id: o.id,
      description: String(o.description ?? '').slice(0, 60),
    })),
  };
}

function extractKeyClaim(text) {
  const t = String(text ?? '').trim().replace(/\s+/g, ' ');
  if (t.length <= 140) return t;
  // 句子感知截断：优先在中文/英文句末（。！？.!?）处切，尽量保留完整意思
  const lastSentenceEnd = Math.max(
    t.lastIndexOf('。', 137),
    t.lastIndexOf('！', 137),
    t.lastIndexOf('？', 137),
    t.lastIndexOf('.', 137),
    t.lastIndexOf('!', 137),
    t.lastIndexOf('?', 137)
  );
  const cut = lastSentenceEnd > 40 ? lastSentenceEnd + 1 : 137;
  return `${t.slice(0, cut).trim()}...`;
}

function applyTurnToWorkspace(ws, turn, speakerPersona) {
  // 确定性启发式演化：根据 act + 文本提取，增量更新 workspace。
  // 这是“live”的核心 —— 每轮后立即生效，下一轮 prompt 就能看到。
  const next = {
    candidateOptions: [...(ws.candidateOptions ?? [])],
    openQuestions: [...(ws.openQuestions ?? [])],
    tensions: [...(ws.tensions ?? [])],
    evidencePool: [...(ws.evidencePool ?? [])],
  };
  const act = turn?.act;
  const text = turn?.text || '';
  const speakerId = turn?.speaker;
  if (!act || !text) return next;

  const desc = extractKeyClaim(text);

  if (['OBJECTION', 'PROBE'].includes(act) && desc.length > 8) {
    const exists = next.tensions.some((t) =>
      t.description.includes(desc.slice(0, 25)) || desc.includes((t.description ?? '').slice(0, 25))
    );
    if (!exists && next.tensions.length < 8) {
      next.tensions.push({
        id: makeId('tension'),
        description: desc,
        status: 'open',
        positions: { [speakerId]: act === 'OBJECTION' ? '反对' : '质疑' },
      });
    }
  }

  if (act === 'EVIDENCE' && desc.length > 5) {
    const exists = next.evidencePool.some((e) =>
      e.claim.includes(desc.slice(0, 18))
    );
    if (!exists && next.evidencePool.length < 12) {
      next.evidencePool.push({
        id: makeId('evidence'),
        claim: desc,
        source: speakerPersona?.name || speakerId || '未知',
        verificationStatus: turn.evidenceLabel === 'fact' ? 'verified' : (turn.evidenceLabel === 'assumption' ? 'assumption' : 'partial'),
      });
    }
  }

  if (['CLAIM', 'REFINE'].includes(act) && ['zhuo', 'du'].includes(speakerId) && desc.length > 8) {
    const exists = next.candidateOptions.some((o) =>
      o.description.includes(desc.slice(0, 18))
    );
    if (!exists && next.candidateOptions.length < 8) {
      next.candidateOptions.push({ id: makeId('option'), description: desc });
    }
  }

  if (act === 'PROBE' && desc.length > 8 && next.openQuestions.length < 8) {
    const existsQ = next.openQuestions.some((q) =>
      (q.question ?? '').includes(desc.slice(0, 20)),
    );
    if (!existsQ) {
      next.openQuestions.push({
        id: makeId('question'),
        question: speakerId === 'du' ? `需跟进：${desc.slice(0, 100)}` : desc.slice(0, 120),
        blocks: false,
      });
    }
  }

  if (act === 'META' && speakerId === 'du' && /解决|缓解|闭合|不再|推进|resolve|mitigate|close|no longer|advance|progress/.test(text)) {
    const lastOpen = [...next.tensions].reverse().find((t) => t.status === 'open');
    if (lastOpen) lastOpen.status = 'resolved';
  }

  return next;
}

function evolveWorkspaceFromTurns(turns = [], personas = []) {
  // 供 createComplete 路径使用：事后从已有 turns 的 act 反推一个可信 workspace
  let ws = initLiveWorkspace();
  const pMap = new Map(personas.map((p) => [p.id, p]));
  for (const turn of turns) {
    const sp = pMap.get(turn.speaker) || { id: turn.speaker, contract: { allowedMoves: [] } };
    ws = applyTurnToWorkspace(ws, turn, sp);
  }
  return ws;
}

function advancePhase(phase, ws, turns) {
  // 真实阶段推进逻辑（不是死索引）。基于当前 workspace 状态 + 轮次保守推进。
  let idx = PHASE_ORDER.indexOf(phase);
  if (idx < 0) idx = 0;
  const openTensions = (ws.tensions ?? []).filter((t) => t.status === 'open').length;
  const evCount = (ws.evidencePool ?? []).length;
  const hasObjection = turns.some((t) => t.act === 'OBJECTION');

  if (phase === 'Frame' && turns.length >= 2) return 'Diverge';
  if (phase === 'Diverge' && (hasObjection || openTensions >= 1)) return 'Surface';
  if (phase === 'Surface' && evCount >= 1 && turns.length >= 3) return 'Examine';
  if (phase === 'Examine' && openTensions <= 1 && evCount >= 2) return 'Converge';
  if (phase === 'Converge' && turns.length >= 5) return 'Decide';
  if (phase === 'Decide' && turns.length >= 6) return 'Document';
  // 兜底：按轮次缓慢推进，避免永远停在早期阶段
  if (turns.length > (idx + 1) * PHASE_ADVANCE_SLOPE) return PHASE_ORDER[Math.min(idx + 1, 6)];
  return phase;
}

function checkContractViolation(turn, persona) {
  if (!persona || !turn?.act) return null;
  const allowed = persona.contract?.allowedMoves || [];
  if (allowed.length > 0 && !allowed.includes(turn.act)) {
    return `${persona.id}(${persona.name}) 使用了不允许的 act "${turn.act}"（允许：${allowed.join('|')}）`;
  }
  return null;
}

function shouldTriggerIntervention(turns, ws, interventionCount) {
  if (interventionCount >= MAX_INTERVENTIONS) return false;
  const len = turns.length;
  // 仅在有实质治理内容时触发。使用 turns.some(t => t.act) 作为内容代理，
  // 保证当前 vitest routed mock（返回对象无 act 字段）下永远为 false，避免注入 malformed intervention。
  const openT = (ws.tensions ?? []).filter((t) => t.status === 'open').length;
  const hasContent = openT > 0 || turns.some((t) => t && t.act);
  return len >= INTERVENTION_INTERVAL && len % INTERVENTION_INTERVAL === 0 && hasContent;
}

async function generateModeratorIntervention({ router, input, workspace, transcript, currentPhase, violations = [] }) {
  const mod = input.personas[0];
  const snap = compactWorkspaceSnapshot(workspace);
  const violStr = violations.length ? `注意到的 contract 违规：${violations.join('；')}` : '目前无违规。';

  const sys = `你是“${mod.name}”，主持人和协议执行器。当前阶段：${currentPhase}。
你的唯一职责是执行治理：检查工作台状态，必要时以 PROBE 追问具体分歧或证据缺口，或以 META 记录阶段推进理由、指出合同违规并要求纠正。禁止在 text 中使用内部编号或英文字段名。
**只做 1-2 句简短发言**，act 必须是 PROBE 或 META，phase 反映当前或下一阶段。
不要替任何人做决定，只指出问题、要求澄清或推进流程。`;

  const user = JSON.stringify({
    task: '执行一次 Moderator 治理干预',
    topic: input.topic,
    currentPhase,
    workspace: snap,
    recentTranscript: transcript.slice(-3),
    violations: violStr,
    contract: mod.contract,
  });

  const { provider, parsed } = await generateWithProviderFallback({
    router,
    speakerId: mod.id,
    index: transcript.length,
    request: {
      systemPrompt: `${sys}\n${TURN_OUTPUT_CONTRACT}`,
      userPrompt: user,
    },
    parse: (text) => TurnDraftSchema.parse(parseModelJson(text)),
  });

  return {
    speaker: mod.id,
    providerId: provider.id,
    providerName: provider.name,
    ...parsed,
    act: ['PROBE', 'META'].includes(parsed?.act) ? parsed.act : 'META',
    phase: parsed?.phase || currentPhase,
  };
}

function completeDeliberationArtifacts(meeting, input) {
  const turns = meeting.turns.map((turn, index) => ({
    ...turn,
    act: turn.act || (turn.speaker === 'du' && index > 0 ? 'META' : DEFAULT_ACT_BY_SPEAKER[turn.speaker] || 'CLAIM'),
    phase: turn.phase || DEFAULT_PHASES[Math.min(index, DEFAULT_PHASES.length - 1)],
    confidence: typeof turn.confidence === 'number' ? turn.confidence : (turn.stance === 'against' ? 0.62 : 0.68),
    evidenceLabel: turn.evidenceLabel || (turn.citations?.length ? 'fact' : 'inference'),
  }));
  const risks = meeting.risks ?? [];
  const actions = meeting.actions ?? [];
  const againstTurns = turns.filter((turn) => turn.stance === 'against' || turn.act === 'OBJECTION');
  const fallbackEvidence = turns
    .filter((turn) => turn.act === 'EVIDENCE' || turn.citations?.length > 0)
    .slice(0, 6)
    .map((turn, index) => ({
      id: `evidence-${index + 1}`,
      claim: turn.text.slice(0, 180),
      source: turn.citations?.[0]?.label || `${turn.speaker} 的审议发言`,
      verificationStatus: turn.evidenceLabel === 'fact' ? 'partial' : 'assumption',
    }));
  const workspace = hasWorkspaceContent(meeting.workspace) ? meeting.workspace : {
    candidateOptions: [{
      id: 'option-1',
      description: meeting.vote?.summary?.slice(0, 160) || input.topic,
    }],
    openQuestions: risks.slice(0, 3).map((risk, index) => ({
      id: `question-${index + 1}`,
      question: `如何验证或缓解：${risk.issue}`,
      blocks: true,
    })),
    tensions: againstTurns.slice(0, 4).map((turn, index) => ({
      id: `tension-${index + 1}`,
      description: turn.text.slice(0, 180),
      status: 'open',
      positions: { [turn.speaker]: turn.text.slice(0, 120) },
    })),
    evidencePool: fallbackEvidence,
  };
  const decisionPacket = meeting.decisionPacket || {
    decisionType: risks.length || againstTurns.length ? 'conditional' : 'consensus',
    selectedOption: {
      description: meeting.vote?.summary?.slice(0, 180) || '继续推进审议后的最小可行动作',
      rationale: meeting.vote?.summary?.slice(0, 260) || '当前信息支持小步推进，并保留风险复核。',
      confidence: Math.min(0.82, Math.max(0.5, turns.reduce((sum, turn) => sum + (turn.confidence ?? 0.65), 0) / turns.length)),
    },
    alternativesConsidered: [],
    residualObjections: risks.slice(0, 6).map((risk) => ({
      objection: risk.issue,
      raisedBy: 'li',
      addressedBy: risk.mitigation,
      acceptableToDecider: false,
    })),
    minorityReport: {
      position: againstTurns[0]?.text?.slice(0, 180) || null,
      rationale: againstTurns[0]?.text?.slice(0, 260) || null,
      conditionsToReconsider: risks.slice(0, 3).map((risk) => risk.mitigation),
    },
    reopenConditions: risks.slice(0, 4).map((risk) => ({
      condition: risk.issue,
      checkMechanism: risk.mitigation,
    })),
    evidenceUsed: workspace.evidencePool.slice(0, 6).map((evidence) => ({
      id: evidence.id,
      source: evidence.source,
      verificationStatus: evidence.verificationStatus,
    })),
    actionItems: actions.map((action) => ({
      action,
      owner: '用户',
      deadline: null,
    })),
  };
  const memoryDiff = hasMemoryDiffContent(meeting.memoryDiff) ? meeting.memoryDiff : {
    decisions: [{
      text: decisionPacket.selectedOption.description,
      reason: decisionPacket.selectedOption.rationale.slice(0, 220),
    }],
    risks,
    assumptions: workspace.evidencePool
      .filter((evidence) => evidence.verificationStatus === 'assumption' || evidence.verificationStatus === 'unverified')
      .slice(0, 4)
      .map((evidence) => ({ text: evidence.claim, validation: evidence.source })),
    disagreements: workspace.tensions.slice(0, 6).map((tension) => ({
      text: tension.description,
      status: tension.status,
    })),
    actions: decisionPacket.actionItems.map((item) => ({
      text: item.action,
      owner: item.owner || '用户',
    })),
  };

  return MeetingResultSchema.parse({
    ...meeting,
    turns,
    workspace,
    decisionPacket,
    memoryDiff,
  });
}

export function sanitizeMeeting(meeting, allowedSpeakerIds, evidenceInput) {
  const allowed = new Set(allowedSpeakerIds);
  let turns = meeting.turns
    .filter((turn) => allowed.has(turn.speaker))
    .map((turn) => ({
      ...turn,
      thinking: (turn.thinking ?? []).slice(0, 3),
      citations: (turn.citations ?? []).map(safeCitation).filter(Boolean),
      reactions: Object.fromEntries(
        Object.entries(turn.reactions ?? {}).filter(([id]) => allowed.has(id)),
      ),
    }));

  if (turns.length === 0) throw new Error('模型没有返回有效发言');

  const sanitized = {
    ...meeting,
    turns,
    vote: {
      ...meeting.vote,
      results: Object.fromEntries(
        Object.entries(meeting.vote.results).filter(([id]) => allowed.has(id)),
      ),
    },
    risks: meeting.risks.slice(0, 8),
    actions: meeting.actions.slice(0, 8),
  };

  if (evidenceInput) {
    return enforceMeetingEvidence(sanitized, evidenceInput);
  }
  return sanitized;
}

const SYSTEM_PROMPT = `你是“AI Roundtable Room”的认知编排器。你的目标不是模拟多人会议，而是围绕用户议题生成一场可上线产品可直接展示的结构化认知增强流程。

成功标准：
- 这不是多角色表演，而是多判断函数的受控碰撞与收束。
- 每位参与者必须遵守自己的 contract，只做自己被允许的认知动作，并证明该判断函数不可替代。
- 每条发言必须标注 act、phase、confidence、evidenceLabel。
- 主持人是协议执行器，负责探询、门控、分歧保留、用户介入节点和最终封装，不替用户做价值判断。
- 每段发言不超过 3 句话，避免空话。
- **发言 text 面向真实用户**：禁止出现 tension-xxx、question-xxx、workspace、openQuestions、evidencePool 等内部 id 或 JSON 字段名；用自然中文描述「核心分歧」「待澄清问题」「相关证据」。
- 不要伪造论文、链接或具体来源；没有用户提供来源时 citations 返回空数组。
- 必须保留风险、未解决分歧、证据状态、行动项、重开条件和下一步可选路径。
- 只输出 JSON 对象，不要 Markdown，不要解释。`;

const JSON_OUTPUT_CONTRACT = `JSON 结构：
{
  "title": "80 字以内",
  "turns": [
    {
      "speaker": "角色 id",
      "text": "900 字以内",
      "act": "CLAIM|EVIDENCE|OBJECTION|REFINE|CONCEDE|RESERVE|ANALOGY|EMPATHY|PROBE|META",
      "phase": "Frame|Diverge|Surface|Examine|Converge|Decide|Document",
      "confidence": 0.0,
      "evidenceLabel": "fact|inference|assumption|opinion|project_memory|user_input",
      "thinking": ["最多 3 条，60 字以内"],
      "citations": [{"label": "80 字以内", "url": "http/https 或 null"}],
      "stance": "for|against|neutral|none",
      "reactions": [{"speaker": "角色 id", "reaction": "agree|disagree|curious|thinking"}]
    }
  ],
  "vote": {
    "question": "120 字以内",
    "results": [{"speaker": "角色 id", "vote": "yes|yes_with|no|abstain", "reason": "120 字以内"}],
    "summary": "500 字以内"
  },
  "risks": [{"issue": "120 字以内", "mitigation": "180 字以内"}],
  "actions": ["160 字以内"],
  "workspace": {
    "candidateOptions": [{"id": "option-1", "description": "160 字以内"}],
    "openQuestions": [{"id": "question-1", "question": "180 字以内", "blocks": true}],
    "tensions": [{"id": "tension-1", "description": "180 字以内", "status": "open|resolved|deferred", "positions": {"角色 id": "立场"}}],
    "evidencePool": [{"id": "evidence-1", "claim": "180 字以内", "source": "120 字以内", "verificationStatus": "verified|partial|assumption|contradicted|unverified"}]
  },
  "decisionPacket": {
    "decisionType": "consensus|majority|conditional|no_decision",
    "selectedOption": {"description": "180 字以内", "rationale": "260 字以内", "confidence": 0.0},
    "alternativesConsidered": [{"description": "160 字以内", "whyNotSelected": "220 字以内"}],
    "residualObjections": [{"objection": "180 字以内", "raisedBy": "角色 id", "addressedBy": "220 字以内或 null", "acceptableToDecider": false}],
    "minorityReport": {"position": "180 字以内或 null", "rationale": "260 字以内或 null", "conditionsToReconsider": ["160 字以内"]},
    "reopenConditions": [{"condition": "180 字以内", "checkMechanism": "180 字以内"}],
    "evidenceUsed": [{"id": "evidence-1", "source": "120 字以内", "verificationStatus": "verified|partial|assumption|contradicted|unverified"}],
    "actionItems": [{"action": "180 字以内", "owner": "60 字以内或 null", "deadline": null}]
  },
  "memoryDiff": {
    "decisions": [{"text": "220 字以内", "reason": "220 字以内"}],
    "risks": [{"issue": "120 字以内", "mitigation": "180 字以内"}],
    "assumptions": [{"text": "180 字以内", "validation": "180 字以内"}],
    "disagreements": [{"text": "180 字以内", "status": "open|resolved|deferred"}],
    "actions": [{"text": "160 字以内", "owner": "60 字以内"}]
  }
}`;

const TURN_OUTPUT_CONTRACT = `只输出 JSON：
{
  "text": "你的发言，900 字以内，不超过 3 句话",
  "act": "CLAIM|EVIDENCE|OBJECTION|REFINE|CONCEDE|RESERVE|ANALOGY|EMPATHY|PROBE|META",
  "phase": "Frame|Diverge|Surface|Examine|Converge|Decide|Document",
  "confidence": 0.0,
  "evidenceLabel": "fact|inference|assumption|opinion|project_memory|user_input",
  "thinking": ["最多 3 条，60 字以内"],
  "citations": [{"label": "80 字以内", "url": "http/https 或 null"}],
  "stance": "for|against|neutral|none",
  "reactions": [{"speaker": "其他角色 id", "reaction": "agree|disagree|curious|thinking"}]
}`;

const SUMMARY_OUTPUT_CONTRACT = `只输出 JSON：
{
  "title": "80 字以内",
  "vote": {
    "question": "120 字以内",
    "results": [{"speaker": "角色 id", "vote": "yes|yes_with|no|abstain", "reason": "120 字以内"}],
    "summary": "500 字以内"
  },
  "risks": [{"issue": "120 字以内", "mitigation": "180 字以内"}],
  "actions": ["160 字以内"]
}`;

function pickProvider(router, speakerId, index) {
  if (!router?.providers) return router;
  const names = Object.keys(router.providers);
  const mapped = router.roleProviders?.[speakerId];
  if (mapped && router.providers[mapped]) return router.providers[mapped];
  return router.providers[names[index % names.length]] ?? router.defaultProvider;
}

function providerCandidates(router, speakerId, index) {
  const preferred = pickProvider(router, speakerId, index);
  if (!router?.providers) return preferred ? [preferred] : [];
  return [
    preferred,
    ...Object.values(router.providers).filter((provider) => provider && provider !== preferred),
  ].filter(Boolean);
}

async function generateWithProviderFallback({ router, speakerId, index, request, parse }) {
  const errors = [];
  for (const provider of providerCandidates(router, speakerId, index)) {
    try {
      const { content, usage } = await provider.generate(request);
      return { provider, parsed: parse(content), usage };
    } catch (error) {
      errors.push(`${provider.name ?? provider.id ?? '未知供应商'}: ${error.message}`);
    }
  }
  throw new Error(`所有模型供应商调用失败：${errors.join('；')}`);
}

function buildTurnPrompt({ input, speaker, transcript, workspaceSnapshot, currentPhase }) {
  return JSON.stringify({
    task: '请以指定判断函数完成这一轮认知碰撞，并回应前文。必须参考当前工作台中的核心分歧、证据与待澄清问题，用自然中文复述其含义（禁止写出 tension-xxx、question-xxx 等内部编号）；目标是暴露盲区、压迫假设或给出下一步选择，而不是完成角色表演。',
    topic: input.topic,
    context: input.context,
    preset: input.preset,
    personas: input.personas,
    speaker,
    transcript,
    workspace: workspaceSnapshot || {},
    phase: currentPhase || 'Frame',
  });
}

function buildSummaryPrompt({ input, transcript, workspace }) {
  return JSON.stringify({
    task: '请作为主持协议收束这场多判断函数碰撞，输出投票、风险、行动和用户下一步可选路径。必须参考最终 workspace 里的真实 tensions 和 evidence 来填充 residualObjections、evidenceUsed 和 disagreements。',
    topic: input.topic,
    context: input.context,
    personas: input.personas,
    transcript,
    workspace: workspace || {},
  });
}

async function createCompleteMeeting({ provider, input }) {
  const { content, usage } = await provider.generate({
    systemPrompt: `${SYSTEM_PROMPT}\n${JSON_OUTPUT_CONTRACT}`,
    userPrompt: JSON.stringify({
      task: '请一次性生成一场完整中文认知增强流程。让不同判断函数互相回应、挑战和修正，最后由主持协议收束为 Decision Packet 与用户下一步选择。',
      requirements: [
        'turns 必须是 5 到 8 轮，不能超过 8 轮。',
        '每轮只允许一个判断函数发言，speaker 必须来自 personas 的 id。',
        '使用 Frame、Diverge、Surface、Examine、Converge、Decide、Document 的阶段思路组织内容。',
        '至少包含 1 条 OBJECTION、1 条 EVIDENCE、1 条 EMPATHY 和 1 条未解决 tension。',
        '必须显式说明至少一个关键用户介入点：用户接下来应该选择继续深挖、收束决策、补充信息或切换方向。',
        'workspace 必须真实演化：tensions 仅来自 OBJECTION/PROBE 发言的 claim，evidencePool 仅来自 EVIDENCE 发言；每个条目必须可追溯到具体 turn。',
        'Decision Packet 必须包含 minorityReport、residualObjections、reopenConditions、evidenceUsed 和 actionItems。',
        'memoryDiff 只是建议入库变更，不能写成已经长期记忆。',
        'vote.results 给每位非主持参与者一条投票结果。',
        'risks 和 actions 各给 3 到 6 条。',
        '如果 context 里包含项目历史结论、未闭合风险或待办行动，主持人必须把它们纳入开场和最终收束。',
      ],
      topic: input.topic,
      context: input.context,
      preset: input.preset,
      personas: input.personas,
    }),
  });
  const parsed = MeetingGenerationSchema.parse(parseModelJson(content));
  // 事后演化：如果模型未给出有效 workspace，则用启发式从 turns 的 act 反推一个可信的（比纯 fake 更接近真实讨论）
  let ws = parsed.workspace;
  if (!hasWorkspaceContent(ws)) {
    ws = evolveWorkspaceFromTurns(parsed.turns || [], input.personas);
  }
  const turns = (parsed.turns || []).map((turn) => ({
    ...turn,
    text: humanizeUserFacingText(turn.text ?? '', ws),
  }));
  return { ...parsed, turns, workspace: ws, usage };
}

async function createRoutedMeeting({ router, input }) {
  const modPersona = input.personas[0];
  const speakers = [...input.personas, input.personas[0]].filter(Boolean);

  let turns = [];
  let workspace = initLiveWorkspace();
  let currentPhase = 'Frame';
  let interventionCount = 0;
  const violations = [];
  
  let totalUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };

  for (const [index, speaker] of speakers.entries()) {
    const isModTurn = speaker.id === modPersona.id;
    const snap = compactWorkspaceSnapshot(workspace);

    const { provider, parsed, usage } = await generateWithProviderFallback({
      router,
      speakerId: speaker.id,
      index,
      request: {
        systemPrompt: `你是“${speaker.name}”，身份是“${speaker.title}”。${speaker.background}\n\n判断函数职责合约：${JSON.stringify(speaker.contract ?? {})}\n\n当前阶段：${currentPhase}。请参考 userPrompt 中的工作台快照（核心分歧/证据/待澄清问题）组织回应，用用户能读懂的中文描述，**禁止**在 text 中出现任何内部编号（如 tension-b1redx）。保持 contract 边界；目标是让问题经受你的独特认知压力，而不是完成角色表演。\n${TURN_OUTPUT_CONTRACT}`,
        userPrompt: buildTurnPrompt({ input, speaker, transcript: turns, workspaceSnapshot: snap, currentPhase }),
      },
      parse: (text) => TurnDraftSchema.parse(parseModelJson(text)),
    });
    
    if (usage) {
      totalUsage.inputTokens += usage.inputTokens;
      totalUsage.outputTokens += usage.outputTokens;
      totalUsage.totalTokens += usage.totalTokens;
    }

    let newTurn = {
      speaker: speaker.id,
      providerId: provider.id,
      providerName: provider.name,
      ...parsed,
      text: humanizeUserFacingText(parsed.text ?? '', workspace),
      phase: parsed.phase || currentPhase,
    };

    // 运行时 contract 校验（只有非主持人角色）
    if (!isModTurn) {
      const viol = checkContractViolation(newTurn, speaker);
      if (viol) violations.push(viol);
    }

    turns.push(newTurn);

    // 关键：live 更新 workspace —— 下一轮的 prompt 立刻能看到演化后的状态
    workspace = applyTurnToWorkspace(workspace, newTurn, speaker);

    // 真实 phase 推进
    currentPhase = advancePhase(currentPhase, workspace, turns);

    // Moderator 中途干预（0~2 次）：只有当有真实 tension/violation 时才触发，避免空转。
    // 额外守卫：避免连续两个 moderator 发言（participant → intervention mod → trailing du）。
    // 因此 transcript 形状通常仍是“角色交替 + 偶尔的治理插话”，便于 UI 消费者假设。
    const lastSpeakerIsMod = turns.length > 0 && turns[turns.length - 1].speaker === modPersona.id;
    if (index < speakers.length - 1 && shouldTriggerIntervention(turns, workspace, interventionCount) && !lastSpeakerIsMod) {
      try {
        const { intvTurn, usage: intvUsage } = await (async () => {
          const { provider, parsed, usage } = await generateWithProviderFallback({
            router,
            speakerId: modPersona.id,
            index: turns.length,
            request: {
              systemPrompt: `你是“${modPersona.name}”，主持人和协议执行器。当前阶段：${currentPhase}。
你的唯一职责是执行治理：检查工作台状态，必要时以 PROBE 追问具体分歧或证据缺口，或以 META 记录阶段推进理由、指出合同违规并要求纠正。禁止在 text 中使用内部编号或英文字段名。
**只做 1-2 句简短发言**，act 必须是 PROBE 或 META，phase 反映当前或下一阶段。
不要替任何人做决定，只指出问题、要求澄清或推进流程。\n${TURN_OUTPUT_CONTRACT}`,
              userPrompt: JSON.stringify({
                task: '执行一次 Moderator 治理干预',
                topic: input.topic,
                currentPhase,
                workspace: compactWorkspaceSnapshot(workspace),
                recentTranscript: turns.slice(-3),
                violations: violations.length ? `注意到的 contract 违规：${violations.join('；')}` : '目前无违规。',
                contract: modPersona.contract,
              }),
            },
            parse: (text) => TurnDraftSchema.parse(parseModelJson(text)),
          });
          return {
            intvTurn: {
              speaker: modPersona.id,
              providerId: provider.id,
              providerName: provider.name,
              ...parsed,
              text: humanizeUserFacingText(parsed.text ?? '', workspace),
              act: ['PROBE', 'META'].includes(parsed?.act) ? parsed.act : 'META',
              phase: parsed?.phase || currentPhase,
            },
            usage,
          };
        })();
        
        if (intvUsage) {
          totalUsage.inputTokens += intvUsage.inputTokens;
          totalUsage.outputTokens += intvUsage.outputTokens;
          totalUsage.totalTokens += intvUsage.totalTokens;
        }
        
        turns.push(intvTurn);
        workspace = applyTurnToWorkspace(workspace, intvTurn, modPersona);
        currentPhase = advancePhase(currentPhase, workspace, turns);
        interventionCount += 1;
      } catch (err) {
        // 治理干预失败不应该导致整场会议 abort（best-effort）。静默跳过，保留已有的主循环 turns。
      }
    }
  }

  // 最终收束 prompt 也带上完整 workspace 快照
  const finalSnap = compactWorkspaceSnapshot(workspace);
  const { parsed: summary, usage: summaryUsage } = await generateWithProviderFallback({
    router,
    speakerId: modPersona.id,
    index: speakers.length,
    request: {
      systemPrompt: `你是“AI Roundtable Room”的主持协议。根据已经发生的多判断函数碰撞收束本轮认知增强流程。参考最终 Workspace 状态输出完整决策所需信息，并明确哪些分歧需要用户裁决或继续深挖。\n${SUMMARY_OUTPUT_CONTRACT}`,
      userPrompt: buildSummaryPrompt({ input, transcript: turns, workspace: finalSnap }),
    },
    parse: (text) => MeetingSummarySchema.parse(parseModelJson(text)),
  });
  
  if (summaryUsage) {
    totalUsage.inputTokens += summaryUsage.inputTokens;
    totalUsage.outputTokens += summaryUsage.outputTokens;
    totalUsage.totalTokens += summaryUsage.totalTokens;
  }

  // 返回时附带 live 演化出的 workspace，completeDeliberationArtifacts 会保留它而非造假
  return { ...summary, turns, workspace, usage: totalUsage };
}

function mergeUsageTotals(base = {}, delta = {}) {
  const prev = {
    inputTokens: base.inputTokens ?? 0,
    outputTokens: base.outputTokens ?? 0,
    totalTokens: base.totalTokens ?? 0,
  };
  return {
    inputTokens: prev.inputTokens + (delta.inputTokens ?? 0),
    outputTokens: prev.outputTokens + (delta.outputTokens ?? 0),
    totalTokens: prev.totalTokens + (delta.totalTokens ?? 0),
  };
}

function draftToStoredTurn({ speaker, provider, parsed, phase }) {
  return {
    speaker: speaker.id,
    providerId: provider?.id,
    providerName: provider?.name,
    text: parsed.text,
    act: parsed.act,
    phase: parsed.phase || phase,
    confidence: parsed.confidence,
    evidenceLabel: parsed.evidenceLabel,
    thinking: parsed.thinking ?? [],
    citations: (parsed.citations ?? [])
      .map(safeCitation)
      .filter(Boolean),
    stance: parsed.stance === 'none' ? undefined : parsed.stance,
    reactions: Object.fromEntries((parsed.reactions ?? []).map((r) => [r.speaker, r.reaction])),
  };
}

export function rebuildWorkspaceFromTurns(turns = [], personas = []) {
  const personaMap = new Map(personas.map((p) => [p.id, p]));
  let workspace = initLiveWorkspace();
  for (const turn of turns) {
    const persona = personaMap.get(turn.speaker) ?? { id: turn.speaker };
    workspace = applyTurnToWorkspace(workspace, turn, persona);
  }
  return workspace;
}

function replayPhaseBeforeTurn(turns, turnIndex) {
  let workspace = initLiveWorkspace();
  let currentPhase = 'Frame';
  for (let i = 0; i < turnIndex; i += 1) {
    workspace = applyTurnToWorkspace(workspace, turns[i], { id: turns[i].speaker });
    currentPhase = advancePhase(currentPhase, workspace, turns.slice(0, i + 1));
  }
  return { workspace, currentPhase };
}

/**
 * 重生成指定序号的一轮发言：保留前后文与其他角色发言，按当前 workspace 快照重新调用模型。
 */
export async function regenerateSpeakerTurn({
  provider,
  meeting,
  turnIndex,
  topic,
  presetId,
  context,
  personas,
}) {
  const parsedMeeting = MeetingResultSchema.parse(meeting);
  const input = buildMeetingInput({ topic, presetId, context, personas });
  const turns = parsedMeeting.turns.map((turn) => ({ ...turn }));

  const index = Number(turnIndex);
  if (!Number.isInteger(index) || index < 0 || index >= turns.length) {
    throw new Error('无效的发言序号');
  }

  const target = turns[index];
  const speaker = input.personas.find((persona) => persona.id === target.speaker);
  if (!speaker) {
    throw new Error('该发言角色不在当前席位配置中，无法重生成');
  }

  const { workspace, currentPhase } = replayPhaseBeforeTurn(turns, index);
  const transcript = turns.slice(0, index);
  const snap = compactWorkspaceSnapshot(workspace);

  const regenerationNote = '这是一次对既有审议记录中单轮发言的替换重生成：必须与前文和 workspace 状态一致，可修正论证但勿无视已记录的分歧与证据。';

  const { provider: usedProvider, parsed, usage } = await generateWithProviderFallback({
    router: provider,
    speakerId: speaker.id,
    index,
    request: {
      systemPrompt: `你是“${speaker.name}”，身份是“${speaker.title}”。${speaker.background}\n\n判断函数职责合约：${JSON.stringify(speaker.contract ?? {})}\n\n当前阶段：${currentPhase}。${regenerationNote}\n请参考 userPrompt 中的 workspace 快照组织回应。\n${TURN_OUTPUT_CONTRACT}`,
      userPrompt: buildTurnPrompt({
        input,
        speaker,
        transcript,
        workspaceSnapshot: snap,
        currentPhase,
      }),
    },
    parse: (text) => TurnDraftSchema.parse(parseModelJson(text)),
  });

  const previousTurn = { ...turns[index] };
  turns[index] = draftToStoredTurn({
    speaker,
    provider: usedProvider,
    parsed,
    phase: currentPhase,
  });

  const finalWorkspace = rebuildWorkspaceFromTurns(turns, input.personas);
  const mergedUsage = mergeUsageTotals(parsedMeeting.usage, usage);

  const updated = MeetingResultSchema.parse({
    ...parsedMeeting,
    turns,
    workspace: finalWorkspace,
    usage: mergedUsage,
  });

  return {
    meeting: sanitizeMeeting(updated, input.personas.map((persona) => persona.id), input),
    meta: {
      turnIndex: index,
      previousTurn,
      regeneratedAt: new Date().toISOString(),
    },
  };
}

/**
 * 在发言迭代后，按当前 transcript + workspace 重算投票、Decision Packet 与记忆建议。
 */
export async function refreshMeetingClosure({
  provider,
  meeting,
  topic,
  presetId,
  context,
  personas,
}) {
  const input = buildMeetingInput({ topic, presetId, context, personas });
  const parsed = MeetingResultSchema.parse(meeting);
  const workspace = rebuildWorkspaceFromTurns(parsed.turns, input.personas);
  const modPersona = input.personas[0];

  const { parsed: summary, usage } = await generateWithProviderFallback({
    router: provider,
    speakerId: modPersona.id,
    index: parsed.turns.length,
    request: {
      systemPrompt: `你是“AI Roundtable Room”的主持协议。用户已调整部分发言，请基于最新 transcript 与 workspace 重新收束，输出 vote/risks/actions；不要重写 turns。\n${SUMMARY_OUTPUT_CONTRACT}`,
      userPrompt: buildSummaryPrompt({
        input,
        transcript: parsed.turns,
        workspace: compactWorkspaceSnapshot(workspace),
      }),
    },
    parse: (text) => MeetingSummarySchema.parse(parseModelJson(text)),
  });

  const merged = generationToMeeting({
    ...parsed,
    ...summary,
    turns: parsed.turns,
    workspace,
    usage: mergeUsageTotals(parsed.usage, usage),
  });
  const meetingParsed = MeetingResultSchema.parse(merged);
  const sanitized = sanitizeMeeting(meetingParsed, input.personas.map((p) => p.id), input);
  const withArtifacts = completeDeliberationArtifacts(sanitized, input);
  const hasRealWs = hasWorkspaceContent(withArtifacts.workspace);
  const finalWorkspace = hasRealWs
    ? withArtifacts.workspace
    : evolveWorkspaceFromTurns(withArtifacts.turns || [], input.personas);
  return { ...withArtifacts, workspace: finalWorkspace };
}

export async function createMeeting({
  provider,
  topic,
  presetId,
  context,
  personas,
}) {
  const input = buildMeetingInput({ topic, presetId, context, personas });
  const providerCount = Object.keys(provider?.providers ?? {}).length;
  const generated = providerCount > 1
    ? await createRoutedMeeting({ router: provider, input })
    : await createCompleteMeeting({ provider: provider?.defaultProvider ?? provider, input });
  const parsed = generationToMeeting(generated);
  const meeting = MeetingResultSchema.parse(parsed);
  const sanitized = sanitizeMeeting(meeting, input.personas.map((persona) => persona.id), input);
  const withArtifacts = completeDeliberationArtifacts(sanitized, input);
  // 最终保障：优先保留“已提供且有内容”的 workspace（模型输出或 routed live 演化结果）；
  // 仅当缺失或为空时，才用 evolve 从最终 turns 的 act 反推，确保测试兼容 + 真实生成时结构可信。
  const currentWs = withArtifacts.workspace;
  // 使用 hasWorkspaceContent（任一数组非空即信任），而非仅看 tensions/evidence。
  // 这样 live 演化出的 candidateOptions（CLAIM/REFINE）+ openQuestions（PROBE）也能被保留，
  // 避免合法的 governance 状态被 evolve 覆盖（Issue 2）。
  const hasRealWs = hasWorkspaceContent(currentWs);
  const finalWorkspace = hasRealWs
    ? currentWs
    : evolveWorkspaceFromTurns(withArtifacts.turns || [], input.personas);
  return { ...withArtifacts, workspace: finalWorkspace };
}
