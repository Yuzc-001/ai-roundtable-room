import { renderToString } from 'react-dom/server';
import { readFile } from 'node:fs/promises';
import { describe, expect, test } from 'vitest';
import { DeliberationOutcomePanel } from './components.jsx';

const BASE_PACKET = {
  decisionType: 'conditional',
  selectedOption: { description: '小范围公开试用', rationale: '风险可控', confidence: 0.72 },
  residualObjections: [{ objection: '质量仍不稳', raisedBy: 'li' }],
  actionItems: [{ id: 'a1', action: '完成 5 个访谈', owner: '用户' }],
};

const BASE_WORKSPACE = {
  openQuestions: [{ id: 'q1', question: '首批用户规模上限？' }],
  tensions: [
    { id: 't1', description: '是否应对全量开放', status: 'open' },
    { id: 't2', description: '客服承载是否足够', status: 'open' },
    { id: 't3', description: '监控指标未对齐', status: 'open' },
  ],
  actionItems: [{ id: 'w1', action: '不应出现的 workspace 项', owner: 'test' }],
};

describe('DeliberationOutcomePanel', () => {
  test('renders full four-cell summary with a11y region', () => {
    const html = renderToString(
      <DeliberationOutcomePanel
        meeting={{
          decisionPacket: BASE_PACKET,
          workspace: BASE_WORKSPACE,
          vote: { summary: '建议附条件推进。' },
        }}
        pendingMemoryCount={2}
      />,
    );
    expect(html).toContain('role="region"');
    expect(html).toContain('aria-label="审议结果一览"');
    expect(html).toContain('小范围公开试用');
    expect(html).toContain('附条件共识');
    expect(html).not.toContain('>conditional<');
    expect(html).toContain('置信');
    expect(html).toContain('72%');
    expect(html).toContain('投票摘要');
    expect(html).toContain('首批用户规模上限');
    expect(html).toContain('完成 5 个访谈');
    expect(html).toContain('项目记忆审批');
    expect(html).toContain('<b>2</b>');
    expect(html).toContain('完整列表见下方「认知碰撞台」');
    expect(html).toContain('分享链接与 HTML 文件包含完整审议内容');
  });

  test('renders workspace-only with path fallback copy', () => {
    const html = renderToString(
      <DeliberationOutcomePanel meeting={{ workspace: { tensions: [], openQuestions: [] } }} />,
    );
    expect(html).toContain('outcome-panel');
    expect(html).toContain('暂无封装建议');
  });

  test('renders packet-only and prefers packet action items', () => {
    const html = renderToString(
      <DeliberationOutcomePanel
        meeting={{
          decisionPacket: BASE_PACKET,
          workspace: { actionItems: [{ action: 'workspace only' }] },
        }}
      />,
    );
    expect(html).toContain('完成 5 个访谈');
    expect(html).not.toContain('workspace only');
  });

  test('shows empty state when packet and workspace are both missing', () => {
    const html = renderToString(<DeliberationOutcomePanel meeting={{ vote: { summary: 'x' } }} />);
    expect(html).toContain('outcome-panel-empty');
    expect(html).toContain('完整记录生成不完整');
    expect(html).not.toContain('outcome-grid');
  });

  test('falls back to open tensions when question strings are empty', () => {
    const html = renderToString(
      <DeliberationOutcomePanel
        meeting={{
          workspace: {
            openQuestions: [{ id: 'q1', question: '' }],
            tensions: [{ id: 't1', description: '开放范围未对齐', status: 'open' }],
          },
        }}
      />,
    );
    expect(html).toContain('开放范围未对齐');
    expect(html).not.toContain('无登记中的开放问题');
  });

  test('shows workspace footnote when questions shown and tensions remain', () => {
    const html = renderToString(
      <DeliberationOutcomePanel
        meeting={{
          workspace: {
            openQuestions: [{ id: 'q1', question: '需要多少样本？' }],
            tensions: [
              { id: 't1', description: '分歧 A', status: 'open' },
              { id: 't2', description: '分歧 B', status: 'open' },
            ],
          },
        }}
      />,
    );
    expect(html).toContain('需要多少样本？');
    expect(html).not.toContain('分歧 A');
    expect(html).toContain('完整列表见下方「认知碰撞台」');
  });

  test('shows footnote when more than two open tensions and no questions', () => {
    const html = renderToString(
      <DeliberationOutcomePanel
        meeting={{
          workspace: {
            openQuestions: [],
            tensions: [
              { id: 't1', description: '分歧 1', status: 'open' },
              { id: 't2', description: '分歧 2', status: 'open' },
              { id: 't3', description: '分歧 3', status: 'open' },
            ],
          },
        }}
      />,
    );
    expect(html).toContain('分歧 1');
    expect(html).toContain('完整列表见下方「认知碰撞台」');
  });

  test('merges residual objections when primary unresolved list is thin', () => {
    const html = renderToString(
      <DeliberationOutcomePanel
        meeting={{
          decisionPacket: {
            ...BASE_PACKET,
            residualObjections: [
              { objection: '留存假设未验证' },
              { objection: '定价未对齐' },
            ],
          },
          workspace: { openQuestions: [], tensions: [] },
        }}
      />,
    );
    expect(html).toContain('留存假设未验证');
    expect(html).toContain('定价未对齐');
  });

  test('omits memory hint when pendingMemoryCount is zero', () => {
    const html = renderToString(
      <DeliberationOutcomePanel meeting={{ decisionPacket: BASE_PACKET }} pendingMemoryCount={0} />,
    );
    expect(html).not.toContain('项目记忆审批');
  });

  test('truncates long decided path in visible text but keeps full title', () => {
    const long = '路径'.repeat(100);
    const html = renderToString(
      <DeliberationOutcomePanel
        meeting={{ decisionPacket: { ...BASE_PACKET, selectedOption: { ...BASE_PACKET.selectedOption, description: long } } }}
      />,
    );
    expect(html).toContain('…');
    expect(html).toContain(`title="${long}"`);
  });
});

describe('completion layout contract', () => {
  test('App.jsx orders outcome → export → continue → full record', async () => {
    const source = await readFile(new URL('./App.jsx', import.meta.url), 'utf8');
    const outcomeIdx = source.indexOf('<DeliberationOutcomePanel');
    const finishLabelIdx = source.indexOf('带走审议成果');
    const finishActionsIdx = source.indexOf('id="finish-actions"');
    const continueLabelIdx = source.indexOf('后续动作');
    const continuePanelIdx = source.indexOf('<ContinueDeliberationPanel');
    const dividerIdx = source.indexOf('完整审议记录');
    expect(outcomeIdx).toBeGreaterThan(-1);
    expect(outcomeIdx).toBeLessThan(finishLabelIdx);
    expect(finishLabelIdx).toBeLessThan(finishActionsIdx);
    expect(finishActionsIdx).toBeLessThan(continueLabelIdx);
    expect(continueLabelIdx).toBeLessThan(continuePanelIdx);
    expect(continuePanelIdx).toBeLessThan(dividerIdx);
    expect(source).toContain('outcomePanelRef');
    const completionBlock = source.slice(source.indexOf('{showVote &&'), source.indexOf('{error &&'));
    expect(completionBlock).not.toContain('gen-memory-cue');
    const dividerPos = completionBlock.indexOf('完整审议记录');
    const continuePos = completionBlock.indexOf('<ContinueDeliberationPanel');
    expect(continuePos).toBeGreaterThan(-1);
    expect(continuePos).toBeLessThan(dividerPos);
  });

  test('styles include outcome panel and finish-actions pairing', async () => {
    const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
    expect(css).toContain('.outcome-panel');
    expect(css).toContain('.finish-actions-label + .finish-actions');
    expect(css).toContain('.finish-actions-label + .continue-panel');
  });
});