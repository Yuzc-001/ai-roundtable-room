import { describe, expect, test, vi } from 'vitest';
import {
  MeetingResultSchema,
  buildMeetingInput,
  createMeeting,
  extractParsedMeeting,
  normalizeTopic,
  parseModelJson,
  sanitizeMeeting,
} from './meeting.js';

describe('normalizeTopic', () => {
  test('trims a valid topic', () => {
    expect(normalizeTopic('  要不要做 AI 圆桌会议？  ')).toBe('要不要做 AI 圆桌会议？');
  });

  test('rejects an empty topic', () => {
    expect(() => normalizeTopic('   ')).toThrow('请输入会议议题');
  });

  test('rejects an overlong topic', () => {
    expect(() => normalizeTopic('问'.repeat(801))).toThrow('议题不能超过 800 字');
  });
});

describe('meeting input', () => {
  test('selects moderator and preset participants only', () => {
    const input = buildMeetingInput({ topic: '如何验证需求？', presetId: 'product' });

    expect(input.topic).toBe('如何验证需求？');
    expect(input.personas.map((p) => p.id)).toEqual(['du', 'zhuo', 'li', 'heng', 'che', 'yang']);
  });

  test('falls back to product preset for unknown presets', () => {
    const input = buildMeetingInput({ topic: '如何验证需求？', presetId: 'missing' });

    expect(input.preset.id).toBe('product');
  });

  test('applies safe persona overrides for selected participants', () => {
    const input = buildMeetingInput({
      topic: '如何验证需求？',
      presetId: 'product',
      personas: [
        {
          id: 'li',
          name: '审',
          title: '审计·上线风险官',
          blurb: '只看会阻止上线的真实风险。',
          background: '安全审查负责人',
        },
      ],
    });

    const reviewer = input.personas.find((persona) => persona.id === 'li');
    expect(reviewer.name).toBe('审');
    expect(reviewer.title).toBe('审计·上线风险官');
    expect(reviewer.blurb).toBe('只看会阻止上线的真实风险。');
  });
});

describe('extractParsedMeeting', () => {
  test('reads parsed structured output from a legacy Responses API message', () => {
    const parsed = { title: '会议', turns: [], vote: { question: 'Q', results: {}, summary: 'S' }, risks: [], actions: [] };
    const response = {
      output: [
        {
          type: 'message',
          content: [{ type: 'output_text', parsed }],
        },
      ],
    };

    expect(extractParsedMeeting(response)).toBe(parsed);
  });

  test('throws when the model refuses', () => {
    const response = {
      output: [
        {
          type: 'message',
          content: [{ type: 'refusal', refusal: '不适合生成' }],
        },
      ],
    };

    expect(() => extractParsedMeeting(response)).toThrow('不适合生成');
  });
});

describe('parseModelJson', () => {
  test('parses direct JSON', () => {
    expect(parseModelJson('{"title":"会议"}')).toEqual({ title: '会议' });
  });

  test('parses fenced JSON from compatible providers', () => {
    expect(parseModelJson('```json\n{"title":"会议"}\n```')).toEqual({ title: '会议' });
  });
});

describe('sanitizeMeeting', () => {
  test('keeps only known speakers and safe citation URLs', () => {
    const meeting = MeetingResultSchema.parse({
      title: '会议',
      turns: [
        {
          speaker: 'du',
          text: '开场',
          thinking: ['拆题'],
          citations: [
            { label: '安全链接', url: 'https://example.com' },
            { label: '危险链接', url: 'javascript:alert(1)' },
          ],
          reactions: { zhuo: 'agree', unknown: 'agree' },
        },
        { speaker: 'unknown', text: '不该出现' },
      ],
      vote: {
        question: '是否推进？',
        results: {
          zhuo: { vote: 'yes', reason: '值得试' },
          unknown: { vote: 'no', reason: '无效' },
        },
        summary: '推进',
      },
      risks: [{ issue: '成本', mitigation: '限制轮次' }],
      actions: ['做 5 个访谈'],
    });

    const clean = sanitizeMeeting(meeting, ['du', 'zhuo']);

    expect(clean.turns).toHaveLength(1);
    expect(clean.turns[0].citations).toEqual([{ label: '安全链接', url: 'https://example.com' }]);
    expect(clean.turns[0].reactions).toEqual({ zhuo: 'agree' });
    expect(Object.keys(clean.vote.results)).toEqual(['zhuo']);
  });
});

describe('createMeeting', () => {
  test('generates a complete meeting with one provider call', async () => {
    const provider = {
      generate: vi.fn(async () => ({
        content: JSON.stringify({
          title: '需求验证圆桌',
          turns: ['du', 'zhuo', 'li', 'heng', 'che'].map((speaker) => ({
            speaker,
            text: `${speaker} 发言。`,
            ...(speaker === 'li' ? {} : { thinking: [], citations: [] }),
            stance: 'neutral',
            ...(speaker === 'li' ? {} : { reactions: [] }),
          })),
          vote: {
            question: '是否推进？',
            results: ['du', 'zhuo', 'li', 'heng', 'che'].map((speaker) => ({
              speaker,
              vote: 'yes_with',
              reason: '值得验证',
            })),
            summary: '小步推进',
          },
          risks: [],
          actions: [],
        }),
        usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
      })),
    };

    const result = await createMeeting({
      provider,
      topic: '如何验证需求？',
      presetId: 'product',
    });

    expect(result.title).toBe('需求验证圆桌');
    expect(provider.generate).toHaveBeenCalledTimes(1);
  });

  test('routes role turns across the configured provider pool', async () => {
    const makeProvider = (label) => ({
      generate: vi.fn(async ({ userPrompt }) => {
        const input = JSON.parse(userPrompt);
        if (input.task.includes('收束')) {
          return {
            content: JSON.stringify({
              title: '多模型圆桌',
              vote: {
                question: '是否推进？',
                results: ['zhuo', 'li', 'heng', 'che', 'yang'].map((speaker) => ({
                  speaker,
                  vote: 'yes_with',
                  reason: `${speaker} 附条件推进`,
                })),
                summary: '多模型角色已分别完成审议，由主持人收束。',
              },
              risks: [{ issue: '多模型延迟更高', mitigation: '限制角色轮次' }],
              actions: ['保留多模型路由并观察耗时'],
            }),
            usage: { inputTokens: 50, outputTokens: 20, totalTokens: 70 },
          };
        }

        return {
          content: JSON.stringify({
            text: `${input.speaker.name} 由 ${label} 生成。`,
            thinking: ['回应议题'],
            citations: [],
            stance: input.speaker.id === 'li' ? 'against' : 'neutral',
            reactions: [],
          }),
          usage: { inputTokens: 30, outputTokens: 10, totalTokens: 40 },
        };
      }),
    });
    const deepseek = makeProvider('deepseek');
    const cpa = makeProvider('cpa');

    const result = await createMeeting({
      provider: {
        defaultProvider: deepseek,
        providers: { deepseek, cpa },
        roleProviders: {},
      },
      topic: '是否需要多 API 圆桌？',
      presetId: 'product',
    });

    expect(result.title).toBe('多模型圆桌');
    expect(result.turns.map((turn) => turn.text)).toContain('渡 由 deepseek 生成。');
    expect(result.turns.map((turn) => turn.text)).toContain('灼 由 cpa 生成。');
    expect(deepseek.generate).toHaveBeenCalled();
    expect(cpa.generate).toHaveBeenCalled();
  });

  test('falls back to the next provider when a routed provider fails', async () => {
    const broken = {
      id: 'broken',
      name: 'Broken API',
      generate: vi.fn(async () => {
        throw new Error('quota exceeded');
      }),
    };
    const backup = {
      id: 'backup',
      name: 'Backup API',
      generate: vi.fn(async ({ userPrompt }) => {
        const input = JSON.parse(userPrompt);
        if (input.task.includes('收束')) {
          return {
            content: JSON.stringify({
              title: '备用模型圆桌',
              vote: {
                question: '是否继续？',
                results: ['zhuo', 'li', 'heng', 'che', 'yang'].map((speaker) => ({
                  speaker,
                  vote: 'yes_with',
                  reason: `${speaker} 附条件继续`,
                })),
                summary: '主供应商失败后由备用供应商完成收束。',
              },
              risks: [{ issue: '供应商不可用', mitigation: '切换备用供应商' }],
              actions: ['继续保留供应商兜底'],
            }),
            usage: { inputTokens: 50, outputTokens: 20, totalTokens: 70 },
          };
        }

        return {
          content: JSON.stringify({
            text: `${input.speaker.name} 由备用供应商生成。`,
            thinking: ['保持会议不中断'],
            citations: [],
            stance: 'neutral',
            reactions: [],
          }),
          usage: { inputTokens: 30, outputTokens: 10, totalTokens: 40 },
        };
      }),
    };

    const result = await createMeeting({
      provider: {
        defaultProvider: broken,
        providers: { broken, backup },
        roleProviders: { du: 'broken' },
      },
      topic: '主模型失败时怎么办？',
      presetId: 'product',
    });

    expect(result.title).toBe('备用模型圆桌');
    expect(result.turns[0].providerName).toBe('Backup API');
    expect(broken.generate).toHaveBeenCalled();
    expect(backup.generate).toHaveBeenCalled();
  });

  test('preserves deliberation artifacts from structured generation', async () => {
    const provider = {
      generate: vi.fn(async () => ({
        content: JSON.stringify({
          title: '结构化产品评审',
          turns: ['du', 'zhuo', 'li', 'heng', 'che'].map((speaker, index) => ({
            speaker,
            text: `${speaker} 发言。`,
            act: index === 0 ? 'PROBE' : speaker === 'li' ? 'OBJECTION' : 'CLAIM',
            phase: index === 0 ? 'Frame' : 'Examine',
            confidence: 0.7,
            evidenceLabel: speaker === 'heng' ? 'fact' : 'inference',
            thinking: [],
            citations: [],
            stance: speaker === 'li' ? 'against' : 'neutral',
            reactions: [],
          })),
          vote: {
            question: '是否推进？',
            results: ['zhuo', 'li', 'heng', 'che'].map((speaker) => ({
              speaker,
              vote: 'yes_with',
              reason: '附条件推进',
            })),
            summary: '建议附条件推进。',
          },
          risks: [{ issue: '用户价值未验证', mitigation: '先做小范围试用' }],
          actions: ['完成 5 个真实用户访谈'],
          workspace: {
            candidateOptions: [{ id: 'option-1', description: '小范围试用' }],
            openQuestions: [{ id: 'question-1', question: '谁会持续使用？', blocks: true }],
            tensions: [{ id: 'tension-1', description: '价值未验证', status: 'open', positions: { li: '反对直接公开' } }],
            evidencePool: [{ id: 'evidence-1', claim: '需要真实用户验证', source: '模型推断', verificationStatus: 'assumption' }],
          },
          decisionPacket: {
            decisionType: 'conditional',
            selectedOption: { description: '小范围试用', rationale: '风险可控', confidence: 0.72 },
            alternativesConsidered: [{ description: '直接公开', whyNotSelected: '风险过高' }],
            residualObjections: [{ objection: '样本不足', raisedBy: 'li', addressedBy: '访谈验证', acceptableToDecider: false }],
            minorityReport: { position: '不宜直接公开', rationale: '质量不稳定', conditionsToReconsider: ['留存达标'] },
            reopenConditions: [{ condition: '留存低于预期', checkMechanism: '一周后看次日留存' }],
            evidenceUsed: [{ id: 'evidence-1', source: '模型推断', verificationStatus: 'assumption' }],
            actionItems: [{ action: '完成 5 个真实用户访谈', owner: '用户', deadline: null }],
          },
          memoryDiff: {
            decisions: [{ text: '附条件小范围试用。', reason: '风险可控' }],
            risks: [{ issue: '用户价值未验证', mitigation: '先做小范围试用' }],
            assumptions: [{ text: '目标用户会愿意反复使用。', validation: '访谈验证' }],
            disagreements: [{ text: '是否直接公开仍有分歧。', status: 'open' }],
            actions: [{ text: '完成 5 个真实用户访谈', owner: '用户' }],
          },
        }),
        usage: { inputTokens: 200, outputTokens: 100, totalTokens: 300 },
      })),
    };

    const result = await createMeeting({
      provider,
      topic: '是否公开试用？',
      presetId: 'product',
    });

    expect(result.turns[0]).toMatchObject({ act: 'PROBE', phase: 'Frame', confidence: 0.7 });
    expect(result.workspace.tensions[0].description).toBe('价值未验证');
    expect(result.decisionPacket.selectedOption.description).toBe('小范围试用');
    expect(result.decisionPacket.minorityReport.position).toBe('不宜直接公开');
    expect(result.memoryDiff.risks[0].issue).toBe('用户价值未验证');
  });
});
