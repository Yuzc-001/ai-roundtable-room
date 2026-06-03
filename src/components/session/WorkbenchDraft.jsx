import { Button, Chip } from '../../ui/index.js';

/** 发起审议前：单一任务 —— 写清议题并启动 */
export function WorkbenchDraft({
  topic,
  onTopicChange,
  topicDisabled,
  parsingFile,
  onFileUpload,
  topicCoach,
  preflight,
  primaryLabel,
  onPrimary,
  primaryDisabled,
  primaryLoading,
  healthLabel,
  healthDetail,
  showPrimary,
  onStarter,
  onDemo,
  onDemoReplay,
  scenarios,
  selectedScenarioId,
  onSelectScenario,
  hasMoreScenarios,
  onManageScenarios,
  topicTemplates,
  onPickTemplate,
  activeTaskTitle,
  setupGuide,
}) {
  const hasTopic = Boolean(topic?.trim());

  return (
    <div className="delib-draft">
      <header className="delib-draft-hero">
        <p className="delib-draft-kicker">议事厅 · 本地决策档案</p>
        <h1>写下一个值得开会的问题</h1>

        <label className="delib-draft-topic-label" htmlFor="delib-draft-topic">
          本场议题（必填）
        </label>
        <div className="delib-draft-topic-wrap">
          <textarea
            id="delib-draft-topic"
            className="textarea topic-input delib-draft-topic"
            value={topic}
            onChange={(event) => onTopicChange(event.target.value)}
            placeholder="例如：我们是否该在 Q3 开放内测？需要哪些证据才能拍板？"
            disabled={topicDisabled}
            rows={3}
          />
          {!topicDisabled && (
            <label className="file-upload-lite delib-draft-upload" title="上传 PDF 作为背景材料">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
              <span>附 PDF</span>
              <input type="file" accept=".pdf" onChange={onFileUpload} style={{ display: 'none' }} disabled={parsingFile} />
            </label>
          )}
        </div>

        {topicCoach}

        {preflight}

        <p className="delib-draft-lead">
          {hasTopic
            ? '查看决策就绪评分与检查项，确认后启动。审议中可在控制台暂停并注入约束。'
            : '先在上方输入议题，或点下面卡片一键填入示例。'}
        </p>
        {showPrimary && (
          <Button
            variant="primary"
            className="delib-draft-cta"
            loading={primaryLoading}
            disabled={primaryDisabled}
            onClick={onPrimary}
          >
            {primaryLabel}
          </Button>
        )}
        <p className="delib-draft-trust" title={healthDetail || undefined}>{healthLabel}</p>
        <p className="delib-draft-hint">
          右侧「情报」侧栏可入库材料、预览检索命中；两场审议后可用「假设对比」并排查看差异。
        </p>
      </header>

      {setupGuide}

      <section className="delib-draft-section" aria-label="快速开始">
        <h2>快速开始</h2>
        <div className="delib-draft-cards">
          <button type="button" className="delib-draft-card" onClick={() => onStarter('product')}>
            <b>产品认知压测</b>
            <span>分歧、证据缺口与下一步</span>
          </button>
          <button type="button" className="delib-draft-card" onClick={() => onStarter('business')}>
            <b>商业判断</b>
            <span>价值假设与验证路径</span>
          </button>
          <button type="button" className="delib-draft-card" onClick={onDemo}>
            <b>先看演示</b>
            <span>直接打开结论与导出，无需 API</span>
          </button>
          {onDemoReplay && (
            <Button type="button" variant="ghost" size="sm" className="delib-draft-replay-link" onClick={onDemoReplay}>
              改为观看逐条发言回放
            </Button>
          )}
        </div>
      </section>

      <section className="delib-draft-section" aria-label="场景与模板">
        <h2>
          审议场景
          {activeTaskTitle && <span className="delib-draft-task">当前任务：{activeTaskTitle}</span>}
        </h2>
        <div className="delib-draft-chips">
          {scenarios.map((s) => (
            <Chip
              key={s.id}
              active={selectedScenarioId === s.id}
              onClick={() => onSelectScenario(s.id)}
            >
              {s.name}
            </Chip>
          ))}
          {hasMoreScenarios && (
            <Chip onClick={onManageScenarios}>更多</Chip>
          )}
          <Button type="button" variant="ghost" size="sm" onClick={onManageScenarios}>
            管理
          </Button>
        </div>
        <h3 className="delib-draft-sub">议题模板</h3>
        <div className="delib-draft-chips">
          {topicTemplates.map((tpl) => (
            <Chip key={tpl.id} title={tpl.hint} onClick={() => onPickTemplate(tpl)}>
              {tpl.label}
            </Chip>
          ))}
        </div>
      </section>
    </div>
  );
}