/** 审议场景编写说明（工作台 + 官网共用文案结构） */
export const SCENARIO_GUIDE = {
  zh: {
    title: '如何编写审议场景',
    lead: '场景 = 一类问题的「开场模板」：名称、默认议题、审议协议（预设）、可选席位。写好场景后，每次发起审议不必重复填背景。',
    sections: [
      {
        title: '1. 先选审议预设（协议）',
        body: '预设决定主持节奏与角色分工：产品、商业、法务、技术路线等。场景里的「审议预设」通常与问题类型一致；不确定时先用「产品决策」。',
      },
      {
        title: '2. 写默认议题（最重要）',
        body: '用 2–4 句写清：背景、约束、你要团队回答的一句话。避免空泛口号。',
        examples: [
          '我们计划 6 月对 50 名真实用户开放试用。当前完成度约 70%，已知有 3 个 P0 缺陷。请在保留风险可见的前提下，判断是否应延期 2 周再开放，并给出最小验证路径。',
          '合作方要求在合同中增加「算法输出免责」条款。请从合规与商业弹性两方面，列出可接受与不可接受的表述边界。',
        ],
      },
      {
        title: '3. 名称与说明',
        body: '名称用 4–12 字概括场景（如「上线闸门」「合同条款」）。说明写给谁用、解决什么决策（可选，便于日后在列表里辨认）。',
      },
      {
        title: '4. 自定义席位（可选）',
        body: '默认使用预设全套席位。若议题只需部分角色（如只要红队 + 主持），可勾选自定义席位，但必须保留该预设的主持人。',
      },
      {
        title: '5. 内置场景可以怎么用',
        body: '内置场景来自系统预设，可直接选用；也可「编辑」保存为你的覆盖版本，或「复制为我的场景」再随意改名。删除内置场景会从列表隐藏，可在管理里「恢复默认」。',
      },
    ],
    checklist: [
      '议题里是否有一句明确的待决问题？',
      '是否写了关键约束（时间、预算、合规、人数）？',
      '预设是否与问题类型匹配？',
      '若裁剪席位，是否仍包含主持人？',
    ],
    ctaWorkbench: '返回工作台编写',
    ctaManage: '打开场景管理',
  },
  en: {
    title: 'How to write a deliberation scenario',
    lead: 'A scenario is a reusable starter: name, default topic, protocol (preset), and optional seats. Once saved, you do not retype context every session.',
    sections: [
      {
        title: '1. Pick a protocol preset',
        body: 'Presets set moderator pacing and roles (product, business, legal, technical). Match the preset to the decision type; when unsure, start with Product.',
      },
      {
        title: '2. Write the default topic (most important)',
        body: 'Use 2–4 sentences: context, constraints, and one sentence the table must answer. Avoid vague slogans.',
        examples: [
          'We plan a 50-user trial in June. Build is ~70% done with three P0 bugs. Should we slip two weeks, and what is the smallest validation path if we ship on time?',
          'A partner wants a broad “algorithm output disclaimer” clause. List acceptable vs unacceptable wording for legal and commercial flexibility.',
        ],
      },
      {
        title: '3. Name and description',
        body: 'Use a short name (e.g. “Launch gate”, “Contract clause”). Description is optional but helps you recognize the scenario later.',
      },
      {
        title: '4. Custom seats (optional)',
        body: 'By default all preset seats join. You may select a subset, but the preset moderator must stay on the roster.',
      },
      {
        title: '5. Built-in scenarios',
        body: 'Built-ins are ready to use. You may edit (saved as your override), duplicate as “my copy”, or hide from the list and restore defaults later.',
      },
    ],
    checklist: [
      'Is there one clear decision question?',
      'Are constraints stated (time, budget, compliance, scale)?',
      'Does the preset fit the question type?',
      'If seats are trimmed, is the moderator still included?',
    ],
    ctaWorkbench: 'Back to workbench',
    ctaManage: 'Open scenario manager',
  },
};

export const SCENARIO_TOPIC_PLACEHOLDER = {
  zh: '示例：我们计划在 Q3 对首批用户开放试用，当前有 2 个 P0 缺陷未修。请判断应按时上线还是延期 2 周，并给出最小验证路径与回滚条件。',
  en: 'Example: We plan a first-user trial in Q3 with two open P0 bugs. Should we ship on schedule or slip two weeks? State the smallest validation path and rollback triggers.',
};