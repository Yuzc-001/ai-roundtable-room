/**
 * 1.4 认知议会：三阶段审议 + 互评防长度偏见 + 审计轨迹
 */

import { z } from 'zod';
import { parseModelJson } from './model-json.js';

const Stage1Schema = z.object({
  text: z.string().min(1).max(900),
  confidence: z.number().min(0).max(1).optional(),
  evidenceLabel: z.enum(['fact', 'inference', 'assumption', 'opinion', 'user_input']).optional(),
  citations: z.array(z.object({
    label: z.string().max(80),
    url: z.string().max(300).nullable().optional(),
  })).max(3).optional(),
});

const Stage2RankSchema = z.object({
  rankings: z.array(z.object({
    anonymousId: z.string().min(1).max(8),
    score: z.number().min(1).max(10),
    rationale: z.string().max(220),
  })).min(1).max(12),
});

const ChairmanSchema = z.object({
  synthesis: z.string().min(1).max(1200),
  decisionSummary: z.string().min(1).max(500),
  topRankedIds: z.array(z.string()).max(8).default([]),
  residualTensions: z.array(z.string().max(180)).max(6).default([]),
});

const STAGE1_CONTRACT = `只输出 JSON：{"text":"首答，不超过3句话","confidence":0.0,"evidenceLabel":"inference|fact|assumption|opinion|user_input","citations":[{"label":"来源","url":null}]}`;

const STAGE2_CONTRACT = `只输出 JSON：{"rankings":[{"anonymousId":"A","score":8,"rationale":"120字内，评价论证质量而非篇幅"}]}`;
// 必须对每条 anonymousId 打分；禁止因回答更长而给更高分。

const CHAIRMAN_CONTRACT = `只输出 JSON：{"synthesis":"主席综合，500字内","decisionSummary":"用户下一步选择，260字内","topRankedIds":["A"],"residualTensions":["仍未解决的分歧"]}`;

function anonLabel(index) {
  return String.fromCharCode(65 + index);
}

/** 长度归一化：字符数惩罚，降低「写得更长=更高分」偏见 */
export function lengthAdjustedScore(rawScore, charCount) {
  const score = Number(rawScore);
  if (!Number.isFinite(score)) return 0;
  const len = Math.max(charCount, 80);
  const penalty = Math.min(2.5, Math.log10(len / 120) * 1.2);
  return Math.max(1, Math.min(10, score - Math.max(0, penalty)));
}

export function aggregatePeerRankings(reviews = [], opinions = []) {
  const charByAnon = Object.fromEntries(
    opinions.map((o) => [o.anonymousId, (o.text || '').length]),
  );
  const totals = {};
  const rationales = {};

  for (const review of reviews) {
    for (const row of review.rankings ?? []) {
      const id = row.anonymousId;
      const adj = lengthAdjustedScore(row.score, charByAnon[id] ?? 200);
      totals[id] = (totals[id] ?? 0) + adj;
      if (!rationales[id]) rationales[id] = [];
      rationales[id].push({ reviewer: review.reviewerId, score: adj, rationale: row.rationale });
    }
  }

  const ranked = Object.entries(totals)
    .map(([anonymousId, totalScore]) => ({
      anonymousId,
      totalScore: Number(totalScore.toFixed(2)),
      speakerId: opinions.find((o) => o.anonymousId === anonymousId)?.speakerId,
      reviews: rationales[anonymousId] ?? [],
    }))
    .sort((a, b) => b.totalScore - a.totalScore);

  return ranked;
}

export function buildCouncilAuditTrail({ stage1 = [], stage2 = [], peerRanking = [], challenges = [] }) {
  return {
    version: '1.4',
    stages: [
      { id: 'parallel', label: '并行首答', count: stage1.length },
      { id: 'peer_review', label: '盲评互排', count: stage2.length },
      { id: 'chair', label: '主席裁决', count: 1 },
    ],
    stage1: stage1.map((o) => ({
      anonymousId: o.anonymousId,
      speakerId: o.speakerId,
      providerId: o.providerId,
      textPreview: String(o.text || '').slice(0, 120),
    })),
    stage2: stage2.map((r) => ({
      reviewerId: r.reviewerId,
      rankings: r.rankings,
    })),
    peerRanking,
    challenges,
    generatedAt: new Date().toISOString(),
  };
}

function pickProvider(router, speakerId, index) {
  if (!router?.providers) return router?.defaultProvider ?? router;
  const names = Object.keys(router.providers);
  const mapped = router.roleProviders?.[speakerId];
  if (mapped && router.providers[mapped]) return router.providers[mapped];
  return router.providers[names[index % names.length]] ?? router.defaultProvider;
}

async function callProvider(provider, { systemPrompt, userPrompt, parse }) {
  const { content, usage } = await provider.generate({ systemPrompt, userPrompt });
  return { parsed: parse(content), usage };
}

export function shouldUseCognitiveCouncil(provider, council = {}) {
  if (council?.enabled === false) return false;
  if (council?.enabled === true) return true;
  const count = Object.keys(provider?.providers ?? {}).length;
  return count > 1;
}

export function buildInterventionContext(intervention = {}) {
  const parts = [];
  if (intervention?.paused) {
    parts.push('[审议状态] 用户已请求暂停；恢复后须尊重下列约束。');
  }
  if (intervention?.constraints) {
    parts.push(`[用户干预约束]\n${String(intervention.constraints).slice(0, 1200)}`);
  }
  if (intervention?.directive) {
    parts.push(`[用户方向指令]\n${String(intervention.directive).slice(0, 600)}`);
  }
  return parts.join('\n');
}

function buildCouncilBrief({ stage1, stage2, peerRanking, chairman }) {
  return [
    '[认知议会 Stage1 匿名首答]',
    ...stage1.map((o) => `${o.anonymousId}（${o.speakerName}）: ${o.text}`),
    '[Stage2 盲评综合排名]',
    ...peerRanking.map((r, i) => `${i + 1}. ${r.anonymousId} 得分 ${r.totalScore}`),
    `[主席裁决] ${chairman.synthesis}`,
    `[下一步] ${chairman.decisionSummary}`,
    chairman.residualTensions?.length
      ? `[未解分歧] ${chairman.residualTensions.join('；')}`
      : '',
  ].filter(Boolean).join('\n');
}

function finalizeCouncilPartial({ stage1, stage2, chairman, input }) {
  const peerRanking = aggregatePeerRankings(stage2, stage1);
  const challenges = peerRanking.slice(0, 4).flatMap((row, idx) => {
    if (idx === 0) return [];
    const winner = peerRanking[0];
    return [{
      challenger: row.speakerId,
      target: winner?.speakerId,
      issue: `盲评排名第 ${idx + 1}（${row.anonymousId}）与首位（${winner?.anonymousId}）存在论证差距`,
      scoreGap: Number((winner.totalScore - row.totalScore).toFixed(2)),
    }];
  });
  const audit = buildCouncilAuditTrail({ stage1, stage2, peerRanking, challenges });
  const briefForDeliberation = buildCouncilBrief({ stage1, stage2, peerRanking, chairman });
  return {
    stage1,
    stage2,
    peerRanking,
    chairman,
    audit,
    challenges,
    briefForDeliberation,
  };
}

export async function runCouncilStage1({ router, input, intervention = {} }) {
  const participants = input.personas.filter((p) => !p.isModerator);
  const interventionBlock = buildInterventionContext(intervention);
  const stage1 = [];
  await Promise.all(participants.map(async (speaker, index) => {
    const provider = pickProvider(router, speaker.id, index);
    const anonymousId = anonLabel(index);
    const sys = `你是判断函数「${speaker.title}」。${speaker.background}
输出匿名首答（用户看不到你的身份，仅显示为 ${anonymousId}）。禁止内部编号。
${STAGE1_CONTRACT}`;
    const user = JSON.stringify({
      task: 'Stage1 并行首答',
      topic: input.topic,
      context: [input.context, interventionBlock].filter(Boolean).join('\n'),
      speaker: { id: speaker.id, title: speaker.title, contract: speaker.contract },
      anonymousId,
    });

    const { parsed } = await callProvider(provider, {
      systemPrompt: sys,
      userPrompt: user,
      parse: (text) => Stage1Schema.parse(parseModelJson(text)),
    });

    stage1.push({
      anonymousId,
      speakerId: speaker.id,
      speakerName: speaker.name,
      providerId: provider.id,
      providerName: provider.name,
      text: parsed.text,
      confidence: parsed.confidence,
      evidenceLabel: parsed.evidenceLabel,
      citations: parsed.citations ?? [],
    });
  }));
  return { stage1, interventionBlock };
}

export async function runCouncilStage2({ router, input, stage1 }) {
  const participants = input.personas.filter((p) => !p.isModerator);
  const blindPack = stage1.map((o) => ({
    anonymousId: o.anonymousId,
    text: o.text,
    charCount: o.text.length,
  }));

  const stage2 = [];
  for (const [index, reviewer] of participants.entries()) {
    const provider = pickProvider(router, reviewer.id, index + 10);
    const sys = `你是匿名评审员。根据论证质量、证据与可检验性排名，**不得**因回答更长而给更高分。
${STAGE2_CONTRACT}`;
    const user = JSON.stringify({
      task: 'Stage2 盲评互排',
      topic: input.topic,
      opinions: blindPack,
      reviewerRole: reviewer.title,
    });

    const { parsed } = await callProvider(provider, {
      systemPrompt: sys,
      userPrompt: user,
      parse: (text) => Stage2RankSchema.parse(parseModelJson(text)),
    });

    stage2.push({
      reviewerId: reviewer.id,
      reviewerName: reviewer.name,
      providerId: provider.id,
      rankings: parsed.rankings.map((r) => ({
        ...r,
        lengthAdjusted: lengthAdjustedScore(
          r.score,
          blindPack.find((b) => b.anonymousId === r.anonymousId)?.charCount ?? 200,
        ),
      })),
    });
  }
  return { stage2 };
}

export async function runCouncilStage3Chair({ router, input, stage1, stage2, intervention = {} }) {
  const moderator = input.personas.find((p) => p.isModerator) ?? input.personas[0];
  const interventionBlock = buildInterventionContext(intervention);
  const peerRanking = aggregatePeerRankings(stage2, stage1);
  const chairProvider = pickProvider(router, moderator.id, 99);
  const sys = `你是主持协议（主席），综合 Stage1 首答与 Stage2 盲评结果，产出裁决摘要。保留真实分歧。
${CHAIRMAN_CONTRACT}`;
  const user = JSON.stringify({
    task: 'Stage3 主席 Decision 简报',
    topic: input.topic,
    context: input.context,
    intervention: interventionBlock,
    stage1: stage1.map(({ anonymousId, text }) => ({ anonymousId, text })),
    peerRanking,
    workspaceHints: input.workspaceHints ?? {},
  });

  const { parsed: chairman } = await callProvider(chairProvider, {
    systemPrompt: sys,
    userPrompt: user,
    parse: (text) => ChairmanSchema.parse(parseModelJson(text)),
  });

  return finalizeCouncilPartial({ stage1, stage2, chairman, input });
}

/**
 * Stage 1–2 + chairman brief; returns metadata merged into final meeting.
 */
export async function runCognitiveCouncil({
  router,
  input,
  intervention = {},
}) {
  const { stage1 } = await runCouncilStage1({ router, input, intervention });
  const { stage2 } = await runCouncilStage2({ router, input, stage1 });
  return runCouncilStage3Chair({ router, input, stage1, stage2, intervention });
}

export function councilStage1ToTurns(stage1 = [], phases = ['Diverge', 'Surface', 'Examine']) {
  return stage1.map((opinion, index) => ({
    speaker: opinion.speakerId,
    providerId: opinion.providerId,
    providerName: opinion.providerName,
    text: opinion.text,
    act: 'CLAIM',
    phase: phases[Math.min(index, phases.length - 1)] ?? 'Diverge',
    confidence: opinion.confidence ?? 0.68,
    evidenceLabel: opinion.evidenceLabel ?? 'inference',
    citations: (opinion.citations ?? []).filter((c) => c?.label).map((c) => (
      c.url ? { label: c.label, url: c.url } : { label: c.label }
    )),
    councilMeta: { stage: 'parallel', anonymousId: opinion.anonymousId },
  }));
}

export function attachCouncilToMeeting(meeting, councilResult) {
  if (!councilResult) return meeting;
  return {
    ...meeting,
    council: {
      enabled: true,
      stage1: councilResult.stage1,
      stage2: councilResult.stage2,
      peerRanking: councilResult.peerRanking,
      chairman: councilResult.chairman,
      audit: councilResult.audit,
      challenges: councilResult.challenges,
    },
  };
}