/**
 * 1.5.1 分阶段审议会话：步骤间可注入约束，支持暂停（不 advance 即停）
 */

import { buildMeetingInput, createMeeting } from './meeting.js';
import {
  runCouncilStage1,
  runCouncilStage2,
  runCouncilStage3Chair,
  shouldUseCognitiveCouncil,
} from './cognitive-council.js';
import {
  formatRetrievedIntelBlock,
  hitsToEvidenceItems,
  retrieveIntelChunks,
} from '../src/lib/intelRetrieval.js';
import { mergeIntelligenceIntoContext } from './intelligence.js';
import { assessTopicAdmission } from '../src/lib/topicAdmission.js';

const sessions = new Map();
const SESSION_TTL_MS = 60 * 60 * 1000;

export const STEP_LABELS = {
  intel: '整理项目情报',
  council_s1: '认知议会 · 并行首答',
  council_s2: '认知议会 · 盲评互排',
  council_s3: '认知议会 · 主席裁决',
  deliberate: '受控碰撞审议',
  done: '审议完成',
};

function sessionId() {
  return `delib-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getIntervention(session) {
  const parts = [...(session.injections ?? [])];
  if (session.pendingInjection) {
    parts.push(session.pendingInjection);
    session.pendingInjection = null;
  }
  return {
    constraints: parts.map((p) => p.constraints).filter(Boolean).join('\n'),
    directive: parts.map((p) => p.directive).filter(Boolean).join('\n'),
  };
}

function planSteps({ provider, council, intelHits }) {
  const steps = [];
  if (intelHits?.length) steps.push('intel');
  if (shouldUseCognitiveCouncil(provider, council ?? {})) {
    steps.push('council_s1', 'council_s2', 'council_s3');
  }
  steps.push('deliberate', 'done');
  return steps;
}

export function createDeliberationSession({
  provider,
  topic,
  presetId,
  context,
  personas,
  council = {},
  intelligence = {},
  intelDocuments = [],
  intervention = {},
  admissionOverride = false,
}) {
  const admission = assessTopicAdmission(topic, { forceRoundtable: admissionOverride });
  const input = buildMeetingInput({ topic, presetId, context, personas });
  const query = `${topic}\n${context ?? ''}`;
  const hits = intelDocuments.length
    ? retrieveIntelChunks(intelDocuments, query, 8)
    : [];
  const steps = planSteps({ provider, council, intelHits: hits });

  const session = {
    id: sessionId(),
    createdAt: Date.now(),
    provider,
    body: { topic, presetId, context, personas, council, intelligence, intervention },
    input,
    steps,
    stepIndex: 0,
    hits,
    councilPartial: { stage1: null, stage2: null },
    councilResult: null,
    meeting: null,
    injections: [],
    pendingInjection: null,
    admission,
    paused: false,
  };

  sessions.set(session.id, session);
  return {
    sessionId: session.id,
    steps: steps.map((id) => ({ id, label: STEP_LABELS[id] || id })),
    admission,
    intelHitCount: hits.length,
  };
}

export function getDeliberationSession(id) {
  const session = sessions.get(id);
  if (!session) return null;
  if (Date.now() - session.createdAt > SESSION_TTL_MS) {
    sessions.delete(id);
    return null;
  }
  return session;
}

export function injectDeliberationSession(id, { constraints, directive } = {}) {
  const session = getDeliberationSession(id);
  if (!session) throw new Error('审议会话不存在或已过期');
  session.pendingInjection = {
    constraints: String(constraints ?? '').slice(0, 1200),
    directive: String(directive ?? '').slice(0, 600),
    at: new Date().toISOString(),
  };
  return { ok: true, pending: session.pendingInjection };
}

export function pauseDeliberationSession(id) {
  const session = getDeliberationSession(id);
  if (!session) throw new Error('审议会话不存在或已过期');
  session.paused = true;
  return { ok: true, paused: true };
}

export function resumeDeliberationSession(id) {
  const session = getDeliberationSession(id);
  if (!session) throw new Error('审议会话不存在或已过期');
  session.paused = false;
  return { ok: true, paused: false };
}

function publicStatus(session) {
  const stepId = session.steps[session.stepIndex] ?? 'done';
  return {
    sessionId: session.id,
    stepIndex: session.stepIndex,
    totalSteps: session.steps.length,
    currentStep: stepId,
    currentLabel: STEP_LABELS[stepId] || stepId,
    paused: session.paused,
    completed: stepId === 'done' && Boolean(session.meeting),
    meeting: session.meeting,
    canInject: stepId !== 'done' && stepId !== 'deliberate',
    councilReady: Boolean(session.councilResult),
    intelHitCount: session.hits?.length ?? 0,
  };
}

export async function advanceDeliberationSession(id) {
  const session = getDeliberationSession(id);
  if (!session) throw new Error('审议会话不存在或已过期');
  if (session.paused) {
    return { ...publicStatus(session), waiting: 'paused' };
  }

  const stepId = session.steps[session.stepIndex];
  if (!stepId || stepId === 'done') {
    return publicStatus(session);
  }

  const intervention = getIntervention(session);
  let input = { ...session.input };

  if (stepId === 'intel') {
    const block = formatRetrievedIntelBlock(session.hits);
    if (block) {
      input = {
        ...input,
        context: mergeIntelligenceIntoContext(input.context, hitsToEvidenceItems(session.hits)),
      };
    }
    session.input = input;
    session.stepIndex += 1;
    return publicStatus(session);
  }

  if (stepId === 'council_s1') {
    const { stage1 } = await runCouncilStage1({
      router: session.provider,
      input,
      intervention,
    });
    session.councilPartial.stage1 = stage1;
    session.stepIndex += 1;
    return publicStatus(session);
  }

  if (stepId === 'council_s2') {
    const { stage2 } = await runCouncilStage2({
      router: session.provider,
      input,
      stage1: session.councilPartial.stage1,
    });
    session.councilPartial.stage2 = stage2;
    session.stepIndex += 1;
    return publicStatus(session);
  }

  if (stepId === 'council_s3') {
    session.councilResult = await runCouncilStage3Chair({
      router: session.provider,
      input,
      stage1: session.councilPartial.stage1,
      stage2: session.councilPartial.stage2,
      intervention,
    });
    input = {
      ...input,
      context: [input.context, session.councilResult.briefForDeliberation].filter(Boolean).join('\n\n'),
    };
    session.input = input;
    session.stepIndex += 1;
    return publicStatus(session);
  }

  if (stepId === 'deliberate') {
    const meeting = await createMeeting({
      provider: session.provider,
      topic: session.body.topic,
      presetId: session.body.presetId,
      context: session.input.context,
      personas: session.body.personas,
      council: { enabled: false },
      intelligence: session.body.intelligence,
      intervention,
      prebuiltCouncil: session.councilResult,
    });
    session.meeting = meeting;
    session.stepIndex += 1;
    return publicStatus(session);
  }

  return publicStatus(session);
}

export function clearDeliberationSessionsForTests() {
  sessions.clear();
}