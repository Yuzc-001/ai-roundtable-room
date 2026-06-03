import { renderToString } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { DecisionReadinessPanel } from './DecisionReadinessPanel.jsx';
import { ForkCompareWorkbench } from './ForkCompareWorkbench.jsx';

describe('v15 UI smoke', () => {
  test('DecisionReadinessPanel renders score and checks', () => {
    const html = renderToString(
      <DecisionReadinessPanel
        topic="我们是否应该在 Q3 投入资源，风险与路径如何权衡？"
        health={{ aiConfigured: true }}
        scenarioName="产品决策"
        memoryEnabled
        admissionOverride={false}
        intelSelectedCount={1}
      />,
    );
    expect(html).toContain('决策就绪评估');
    expect(html).toContain('v15-readiness-score-num');
    expect(html).toContain('适合开圆桌');
  });

  test('ForkCompareWorkbench renders pickers', () => {
    const meetings = [
      { id: 1, topic: '场次 A', savedAt: '2026-06-01T10:00:00Z', meeting: { decisionPacket: { selectedOption: { description: 'A' } } } },
      { id: 2, topic: '场次 B', savedAt: '2026-06-02T10:00:00Z', meeting: { decisionPacket: { selectedOption: { description: 'B' } }, fork: { label: '分支' } } },
    ];
    const html = renderToString(<ForkCompareWorkbench meetings={meetings} embedded />);
    expect(html).toContain('假设对比');
    expect(html).toContain('基准场次');
  });
});