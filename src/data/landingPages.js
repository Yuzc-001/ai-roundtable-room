/** Landing sub-page copy (zh / en). Release notes mirror CHANGELOG.md. */
export const RELEASE_NOTES = [
  {
    version: '1.3.2',
    date: '2026-06-02',
    highlights: [
      '议事厅档案感视觉重构：统一五级按钮（primary / secondary / ghost / subtle / danger）',
      '侧栏分组（项目·场景·任务·历史）与单一主行动「发起审议」；空会话场景最多展示 5 个',
      '样式分层导入与官网色板对齐；场景管理行操作改为溢出菜单',
    ],
    highlightsEn: [
      'Archival UI refresh: five-level button system (primary / secondary / ghost / subtle / danger)',
      'Sidebar sections (project · scenario · task · history) with one primary “Start deliberation”; up to 5 scenario chips on empty state',
      'Split CSS imports and aligned landing palette; scenario row actions in overflow menu',
    ],
  },
  {
    version: '1.3.2',
    date: '2026-06-02',
    highlights: [
      '场景编写说明页 /scenario-guide；内置场景可编辑、隐藏、复制为我的场景',
      '场景管理内编写提示与议题示例；侧栏链至说明页',
      '官网可纵向滚动；首页探索卡片与区块入场动效',
    ],
    highlightsEn: [
      'Scenario writing guide at /scenario-guide; built-ins editable, hideable, forkable',
      'In-app tips and default-topic examples; sidebar link to the guide',
      'Landing page scrolls; home sections animate in',
    ],
  },
  {
    version: '1.3.0',
    date: '2026-06-02',
    highlights: [
      '用户场景库：内置预设场景 + 自定义场景（议题骨架、席位、导入导出）',
      '审议任务：项目下跨多场会议的时间线，新会议自动归入当前任务',
      '继续审议与历史记录保留任务 / 场景关联',
    ],
    highlightsEn: [
      'User scenario library: built-in presets plus custom scenarios with import/export',
      'Deliberation tasks: multi-session timeline per project; new meetings attach to the active task',
      'Continue deliberation and history retain task and scenario links',
    ],
  },
  {
    version: '1.2.6',
    date: '2026-06-02',
    highlights: [
      '证据矩阵导出：发言轮次与证据池对照表（HTML / 复盘包内嵌）',
      '会议历史搜索：侧栏按议题或标题过滤（3 场以上显示）',
      '议题模板库：6 类专业议题快捷填入，可联动审议预设',
    ],
    highlightsEn: [
      'Evidence matrix export: turn-by-turn table plus evidence pool (HTML and embedded in minutes)',
      'Meeting history search in the sidebar when a project has more than three sessions',
      'Topic template library: six professional starters that can switch presets',
    ],
  },
  {
    version: '1.2.5',
    date: '2026-06-02',
    highlights: [
      '官网文案与 1.2.x 产品能力对齐：结果一览、证据策略、单轮重生成、继续审议',
      '审议流程页补充完成态阅读顺序与重算收束说明',
      '常见问题新增审议结果修订与证据标注说明',
    ],
    highlightsEn: [
      'Public landing copy aligned with 1.2.x: outcome overview, evidence policy, single-turn regenerate, continue deliberation',
      'Deliberation flow documents completion order and manual closure recalculation',
      'FAQ adds outcome revision and evidence-tag accuracy',
    ],
  },
  {
    version: '1.2.4',
    date: '2026-06-02',
    highlights: [
      '首次成功向导文案与 1.2.x 能力对齐（结果一览、继续审议、证据标注、单轮重生成）',
      '连接验证步骤：自动识别已配置、检查状态与错误提示更清晰',
      '配置步骤注明 API Key 仅服务端读取',
    ],
  },
  {
    version: '1.2.3',
    date: '2026-06-02',
    highlights: [
      '审议完成后「继续审议」紧接结果一览与导出，不必先滚完整记录',
      '完成态分区：结果一览 → 带走成果 → 后续动作 → 完整审议记录',
    ],
  },
  {
    version: '1.2.2',
    date: '2026-06-02',
    highlights: [
      '审议完成态新增「结果一览」：路径、待澄清、行动、导出四格摘要',
      '导出操作紧接一览；HTML/MD 导出加固防分享载荷注入',
    ],
  },
  {
    version: '1.2.1',
    date: '2026-06-02',
    highlights: [
      '证据链强制：无用户材料时不保留无源外链与“事实”标签',
      '发言重生成后可重算投票与 Decision Packet',
      '首次成功四步向导；黄金路径 API 测试',
    ],
  },
  {
    version: '1.2.0',
    date: '2026-06-02',
    highlights: [
      '审议完成后可对单轮发言重生成，保留前后文与其它角色发言',
      'Workspace 随替换轮次重新演化；支持撤销上一次重生成',
    ],
  },
  {
    version: '1.1.4',
    date: '2026-06-02',
    highlights: [
      '导航拆为独立子页：适用场景、审议流程、常见问题、版本更新',
      '支持浏览器后退；「更新」页展示重要版本说明',
    ],
  },
  {
    version: '1.1.3',
    date: '2026-06-02',
    highlights: [
      '首页改为单栏介绍 + 全宽截图，去掉悬浮产品卡片',
    ],
  },
  {
    version: '1.1.2',
    date: '2026-06-02',
    highlights: ['首页文案与配色重做，减少典型 AI 产品页套路'],
  },
  {
    version: '1.1.1',
    date: '2026-06-02',
    highlights: ['修复历史会议标题裁切', '工作区仅展示开放中的分歧'],
  },
  {
    version: '1.1.0',
    date: '2026-06-02',
    highlights: ['新增 docker-compose', '五连版功能升级（配置引导、追问续议、发言聚焦等）'],
  },
  {
    version: '1.0.6–1.0.9',
    date: '2026-06-02',
    highlights: [
      '首次配置引导、证据标签视觉区分',
      '会议追问续议、发言聚焦与历史元数据',
    ],
  },
];

export const LANDING_SITE = {
  zh: {
    version: '1.3.2',
    language: 'EN',
    brand: '圆桌智库',
    nav: [
      { id: 'scenarios', label: '适用场景' },
      { id: 'scenarioGuide', label: '场景编写' },
      { id: 'workflow', label: '审议流程' },
      { id: 'faq', label: '常见问题' },
      { id: 'updates', label: '更新' },
    ],
    backHome: '返回首页',
    primary: '进入工作台',
    demo: '查看演示',
    github: '源码',
    footer: '圆桌智库 · 开源 · 本地运行',
    home: {
      heroKicker: '本地运行 · 开源',
      title: '议题写出来，判断留得住',
      deck: '审议结束以「结果一览」收束：已定路径、待澄清与行动一屏可见；证据按材料校验标注，可导出证据矩阵对照表；审议完成后可对单轮发言重生成，再手动重算收束；支持导出与继续审议。',
      exploreTitle: '进一步了解',
      explore: [
        ['适用场景', '哪些问题值得开一场审议', 'scenarios'],
        ['场景编写', '如何写默认议题与自定义场景', 'scenarioGuide'],
        ['审议流程', '从议题到纪要的阶段', 'workflow'],
        ['常见问题', '部署、模型与数据', 'faq'],
        ['版本更新', '重要发布说明', 'updates'],
      ],
      quickstartTitle: '本地安装',
      quickstartLead: '复制仓库、填写 .env、启动服务。',
      quickstartLines: [
        'git clone https://github.com/Yuzc-001/ai-roundtable-room.git',
        'cd ai-roundtable-room',
        'npm install',
        'cp .env.example .env',
        'npm run dev',
      ],
      shotAlt: '圆桌智库工作台界面',
    },
    scenarios: {
      title: '适用场景',
      lead: '适合需要保留过程、反对意见和下一步条件的判断类问题，而不是简单查资料或润色文稿。',
      items: [
        {
          title: '产品取舍',
          summary: '上线节奏、范围裁剪、风险与用户体验如何同时被看见。',
          examples: ['是否应对第一批真实用户开放试用？', '某功能该现在做还是下个版本？'],
          fit: '需要把「做 / 不做 / 先做哪步」写成可复盘记录。',
        },
        {
          title: '商业判断',
          summary: '价值假设、定价、渠道与验证路径互相质询。',
          examples: ['最小可付费价值是什么？', '免费层与付费层的边界在哪？'],
          fit: '需要暴露假设与反例，而不是只要一段顺滑分析。',
        },
        {
          title: '长期项目',
          summary: '结论、分歧、风险与行动项跨场次沉淀。',
          examples: ['技术路线是否该调整？', '合作条款里哪些条款需要重开讨论？'],
          fit: '需要结果一览、继续审议，以及经审批写入的项目记忆（可关闭），而不是每次从零开始。',
        },
      ],
      notForTitle: '不太适合',
      notFor: ['查一个事实或定义', '润色邮件/文案', '没有权衡空间的机械任务'],
    },
    workflow: {
      title: '审议流程',
      lead: '主持协议按阶段推进，每一轮发言可标注认知动作与证据类型，最后收拢为纪要包。',
      phases: [
        ['开场定调', '明确议题边界、成功标准与已知约束。'],
        ['观点发散', '从不同立场提出主张与类比。'],
        ['分歧暴露', '把未对齐之处写成可追踪的分歧条目。'],
        ['深度质询', '追问证据、假设与可检验问题。'],
        ['共识收拢', '归纳可行路径与残余风险。'],
        ['最终裁定', '形成投票摘要、行动项与重开条件。'],
      ],
      steps: [
        ['写下议题', '输入一个需要权衡风险、证据与下一步的具体问题。可上传 PDF 作为背景。'],
        ['选择协议', '按产品、商业等预设决定参与角色与阶段节奏。'],
        ['阶段审议', '主持协议推进六阶段；发言可标注认知动作与证据类型。无上传材料时不保留无源外链，「事实」类标签自动降级。'],
        ['结果收束', '审议结束后：结果一览四格 → 导出 → 继续审议 → 完整记录。可对单轮发言重生成，再手动重算投票与 Decision Packet；写入项目记忆需审批，后续场次方可引用。'],
      ],
      artifactTitle: '一场审议会留下',
      artifacts: [
        '结果一览（路径、待澄清、行动、导出）',
        '核心分歧与少数意见',
        '证据标注与待核实项',
        '行动清单与重开条件',
        '完整发言过程',
      ],
    },
    faq: {
      title: '常见问题',
      lead: '部署、模型与数据相关的常见疑问。',
      items: [
        ['和直接问大模型有什么不同？', '单轮问答适合查事实、写草稿。这里适合证据不完整、存在反对意见、需要留下过程记录的判断类问题。'],
        ['一定要接很多模型吗？', '不必。配置一个可用模型即可；多个供应商主要用于拉开视角差异与容错。'],
        ['密钥和数据会去哪？', 'API Key 由本地服务读取，浏览器不接触密钥。议题、会议与项目记忆默认留在你的环境。'],
        ['如何检查配置？', '填写 .env 后运行 npm run doctor，按提示修正 API Key、模型名或 Base URL。'],
        ['适合团队吗？', '可先自部署试用。当前侧重个人与小团队本地工作台；团队共享与权限按路线图推进。'],
        ['审议结果可以改吗？', '审议完成后可对单轮发言重生成，保留前后文与其它角色发言；替换后可重算投票与 Decision Packet，不必整场重跑。'],
        ['证据标注可信吗？', '无上传材料时去掉无源外链，「事实」/「用户输入」降级为推断。有材料时，议题与材料中未出现的外链会保留但标为推断引用；无 URL 的「事实」与未在正文体现的项目记忆标签也会降级。'],
      ],
      supportTitle: '参与项目',
      support: [
        ['阅读文档', 'README 与 docs/architecture.md', 'https://github.com/Yuzc-001/ai-roundtable-room#readme'],
        ['提交 Issue', '缺陷、部署或产品建议', 'https://github.com/Yuzc-001/ai-roundtable-room/issues'],
        ['路线图', '后续功能规划', 'https://github.com/Yuzc-001/ai-roundtable-room/blob/main/docs/roadmap.md'],
      ],
    },
    updates: {
      title: '版本更新',
      lead: '记录对产品体验有影响的重要发布。完整变更见仓库 CHANGELOG.md。',
      currentLabel: '当前版本',
    },
  },
  en: {
    version: '1.3.2',
    language: '中文',
    brand: 'Roundtable',
    nav: [
      { id: 'scenarios', label: 'Use cases' },
      { id: 'scenarioGuide', label: 'Scenarios' },
      { id: 'workflow', label: 'Flow' },
      { id: 'faq', label: 'FAQ' },
      { id: 'updates', label: 'Updates' },
    ],
    backHome: 'Back to home',
    primary: 'Open workbench',
    demo: 'View demo',
    github: 'Source',
    footer: 'Roundtable · Open source · Local-first',
    home: {
      heroKicker: 'Local · Open source',
      title: 'Write the question. Keep the judgment.',
      deck: 'Sessions close with an outcome overview: path, open questions, and actions at a glance. Evidence follows your materials; export an evidence matrix table; after deliberation, a single turn can be regenerated, then you manually recalculate closure—export or continue when ready.',
      exploreTitle: 'Learn more',
      explore: [
        ['Use cases', 'What questions fit a session', 'scenarios'],
        ['Writing scenarios', 'Default topic and custom presets', 'scenarioGuide'],
        ['Deliberation flow', 'Stages from topic to minutes', 'workflow'],
        ['FAQ', 'Deploy, models, data', 'faq'],
        ['Release notes', 'Notable versions', 'updates'],
      ],
      quickstartTitle: 'Install locally',
      quickstartLead: 'Clone, configure .env, start the server.',
      quickstartLines: [
        'git clone https://github.com/Yuzc-001/ai-roundtable-room.git',
        'cd ai-roundtable-room',
        'npm install',
        'cp .env.example .env',
        'npm run dev',
      ],
      shotAlt: 'Roundtable workbench',
    },
    scenarios: {
      title: 'Use cases',
      lead: 'For judgment calls that need process, dissent, and next steps—not quick facts or polish.',
      items: [
        {
          title: 'Product tradeoffs',
          summary: 'Launch timing, scope, risk, and UX seen together.',
          examples: ['Ship to first real users now?', 'Build feature A or B first?'],
          fit: 'You need a revisitable record of do / defer / sequence.',
        },
        {
          title: 'Business judgment',
          summary: 'Stress-test value, pricing, and validation paths.',
          examples: ['What is the minimum paid value?', 'Where is the free/paid line?'],
          fit: 'You need assumptions challenged, not a smooth essay.',
        },
        {
          title: 'Long-running projects',
          summary: 'Carry decisions, risks, and actions across sessions.',
          examples: ['Should we change the technical bet?', 'Which contract terms need reopening?'],
          fit: 'You need the outcome overview, continuation, and project memory after approval (opt-out)—not a blank slate each time.',
        },
      ],
      notForTitle: 'Less suited for',
      notFor: ['Looking up a fact', 'Editing copy', 'Mechanical tasks with no tradeoffs'],
    },
    workflow: {
      title: 'Deliberation flow',
      lead: 'A moderator protocol advances stages; turns can tag evidence type; output is a minutes package.',
      phases: [
        ['Frame', 'Boundaries, success criteria, constraints.'],
        ['Diverge', 'Claims and analogies from multiple stances.'],
        ['Surface', 'Named tensions in the workspace.'],
        ['Examine', 'Probe evidence, assumptions, testable questions.'],
        ['Converge', 'Feasible paths and residual risk.'],
        ['Decide', 'Vote summary, actions, reopen triggers.'],
      ],
      steps: [
        ['Write the topic', 'A question needing risk, evidence, and a next move. PDF context optional.'],
        ['Pick a preset', 'Product, business, etc. set roles and pacing.'],
        ['Deliberate', 'Six protocol stages; turns tag cognitive moves and evidence. Without uploads, unsourced links are dropped and “fact” labels downgrade.'],
        ['Close and follow up', 'After deliberation: outcome overview → export → continue deliberation → full record. Regenerate one turn, then manually recalculate votes and the Decision Packet; project memory requires approval before later sessions use it.'],
      ],
      artifactTitle: 'What a session keeps',
      artifacts: [
        'Outcome overview (path, open questions, actions, export)',
        'Tensions and minority views',
        'Evidence notes',
        'Actions and reopen triggers',
        'Full transcript',
      ],
    },
    faq: {
      title: 'FAQ',
      lead: 'Common questions about deployment, models, and data.',
      items: [
        ['How is this different from one-shot chat?', 'Chat fits facts and drafts. This fits incomplete evidence, useful dissent, and a traceable record.'],
        ['Many models required?', 'No. One provider is enough; several widen perspective and resilience.'],
        ['Where do keys and data go?', 'Keys on your server only. Sessions and memory stay local by default.'],
        ['Check configuration?', 'Run npm run doctor after editing .env.'],
        ['Teams?', 'Self-host and evaluate; sharing/permissions are on the roadmap.'],
        ['Can I revise the outcome?', 'After deliberation, regenerate a single turn while keeping context and other speakers; then recalculate votes and the Decision Packet—no full rerun.'],
        ['How trustworthy are evidence tags?', 'Without uploads, unsourced URLs are removed and “fact”/“user input” downgrade to inference. With materials, links not in your topic or files stay but are relabeled as inferred citations; “fact” without a URL and “project_memory” not reflected in the turn body downgrade too.'],
      ],
      supportTitle: 'Get involved',
      support: [
        ['Docs', 'README and architecture', 'https://github.com/Yuzc-001/ai-roundtable-room#readme'],
        ['Issues', 'Bugs and suggestions', 'https://github.com/Yuzc-001/ai-roundtable-room/issues'],
        ['Roadmap', 'What is planned', 'https://github.com/Yuzc-001/ai-roundtable-room/blob/main/docs/roadmap.md'],
      ],
    },
    updates: {
      title: 'Release notes',
      lead: 'Notable releases that affect how you use the product. Full log: CHANGELOG.md in the repo.',
      currentLabel: 'Current version',
    },
  },
};

/** Release bullets for the active landing locale (falls back to zh highlights). */
export function getLocalizedReleaseNotes(lang) {
  return RELEASE_NOTES.map((release) => ({
    ...release,
    highlights:
      lang === 'en' && release.highlightsEn?.length
        ? release.highlightsEn
        : release.highlights,
  }));
}