# Changelog

## 1.3.29 — 2026-06-03

### 小白路径与演示体验修复（全量测试项）

- **首启向导与空工作台互斥**：向导显示时不再叠放 `WorkbenchDraft`，避免双入口困惑
- **演示默认直达结论**：打开演示即展示完整发言 +「审议结果一览」+ 导出，无需等待打字机播完
- **演示回放可选**：「先看演示」直达结论；「观看逐条发言回放」保留动画；播放中可「跳过播放，直接看结论」
- **演示稿人话化**：去除「判断函数 / Decision Packet」等内行术语（`shared/personas.js`）
- **生成中说明**改为决策纪要包等用户语言
- **错误提示**置顶红色条 + 可关闭；**移动端底栏**固定「启动 / 演示」
- **审议工作台**替代「认知碰撞台」对外文案；演示结束自动滚到结果区

## 1.3.28 — 2026-06-03

### 发言不再泄漏内部编号

- 修复 AI 发言中出现 `tension-b1redx`、`openQuestions` 等开发用 id/字段名的问题
- 服务端 prompt 禁止引用内部编号；生成后与展示前统一 `humanizeUserFacingText` 清洗
- 已知分歧/问题 id 会替换为工作台中的中文摘要；未知 id 显示为「该核心分歧」等可读说法
- 阶段标签（如 Surface）在纪要中显示为「分歧暴露」

## 1.3.27 — 2026-06-03

### 议事厅组件体系重塑（非补丁）

- 审议回放拆为独立模块：`SessionRoom` / `SessionChrome` / `SessionMinutes` / `MinuteEntry` / `SessionPresence` / `SessionClosure`
- 弃用旧顶栏 + Bubble 阅读态拼凑；回放页单一 `delib-*` 设计系统（会议纪要式）
- 新用户引导文案：如何读发言、底部席位含义；发起前 `WorkbenchDraft` 重写

## 1.3.26 — 2026-06-03

### 审议回放界面重构（会议纪要式阅读）

- 回放默认进入 **session-playback** 阅读态：议题置顶大字，发言区单列、去卡片阴影
- 每条发言：**序号 + 角色 + 短立场**，正文优先；FRAME/置信度/模型等收进「记录标注」折叠
- 底部席位改为 **细条 SeatStrip**，不再用大头像压正文
- 进入回放自动收起左右侧栏；重生成等操作 hover 显示

## 1.3.25 — 2026-06-03

### 可折叠左右侧栏

- 桌面端可**独立收起/展开**左侧项目栏与右侧情报栏，中间议题与发言区占满可用宽度
- 收起后侧缘显示「项目 / 情报」窄条，一键拉回；偏好写入 `localStorage`
- 专注模式仍为一键双侧收起并进入阅读版式；退出时恢复收起前的侧栏状态
- 侧栏内「任务 / 历史」跳转时，若情报栏已收起会自动展开

## 1.3.24 — 2026-06-03

### 席位区贴底布局

- 审议席位（Stage）从主区中部移到**底部 dock**：发言区在上方滚动，席位始终贴在视口下方，不再悬空占位

## 1.3.23 — 2026-06-03

### 专注模式议题可见性

- 审议回放时顶栏改为「工具条 + 本场议题」双行：完整展示议题全文，不再挤在 72px 单行里被裁切
- 专注（全屏）模式下议题条居中、可换行，滚动发言时顶栏 sticky 保持可见

## 1.3.22 — 2026-06-03

### 快捷键与演示场次心智

- `Ctrl/Cmd + Enter` 从议题框或工作台发起审议（未配置时走演示）
- 回放演示场次时顶栏提示「演示 vs 真实审议」区别

## 1.3.21 — 2026-06-03

### 历史会议备注名

- 侧栏历史可为每场添加 `displayLabel` 备注，搜索与列表优先显示备注

## 1.3.20 — 2026-06-03

### 结果一览跳转认知碰撞台

- 「仍待澄清」脚注可一键滚到工作台「分歧 / 开放问题」区块

## 1.3.19 — 2026-06-03

### 证据矩阵 Markdown 导出

- 完成态新增「导出证据矩阵 (MD)」，便于贴入文档与协作

## 1.3.18 — 2026-06-03

### 历史按任务筛选

- 有审议任务时，历史区可按任务 chip 筛选；显示匹配条数

## 1.3.17 — 2026-06-03

### 继续审议建议追问

- 根据开放问题 / 分歧 / 行动项生成 3 条建议 chip，一键填入继续审议

## 1.3.16 — 2026-06-03

### 回放态配置提醒条

- 未配置 API 时，审议回放界面也可展开配置引导（不必退回空会话）

## 1.3.15 — 2026-06-03

### 审议生成可取消

- 生成中「取消生成」中止请求，避免长时间等待无法退出

## 1.3.14 — 2026-06-03

### 发起前预检条

- 议题已填且 API 就绪时显示：议题质量、场景、任务、阶段数、记忆开关

## 1.3.13 — 2026-06-03

### 议题实时教练

- 输入议题时即时提示：问句结构、权衡表述、不适合圆桌的查事实类问法

## 1.3.12 — 2026-06-03

### UI 体系收尾

- 合并重复的 `RELEASE_NOTES` 1.3.2 条目；版本号与官网同步至 1.3.12
- `Button` 支持 `href` 外链；`ui-principles.md` 与测试对齐 1.3.x 全量迁移

## 1.3.11 — 2026-06-03

### 场景管理与链接按钮

- `ScenarioManager` 场景行主按钮改为 `<Button variant="ghost">`
- `Button` 组件可选 `href`，用于官网「源码」等外链

## 1.3.10 — 2026-06-03

### 完成态与历史区按钮统一

- 带走成果导出区、复制模式切换、历史会议行与删除确认、撤销 toast 全部改用 `Button`
- 重算收束支持 `loading` 状态

## 1.3.9 — 2026-06-03

### 侧栏项目区按钮统一

- 新建/删除/归档/项目记忆开关、场景快捷导航改为 `Button` 五级变体

## 1.3.8 — 2026-06-03

### 克制玻璃拟态

- 移除官网导航与侧栏底栏 `backdrop-filter`；人设抽屉遮罩改为纯色半透明

## 1.3.7 — 2026-06-03

### 导出 HTML 字体对齐议事厅

- `formatMeetingHTML` / 证据矩阵独立页：标题 LXGW WenKai / Source Serif，正文 Source Sans 3（不再 Inter-first）

## 1.3.6 — 2026-06-03

### 官网一屏一 primary

- 导航「源码」改用 `Button href`；hero 演示 CTA 降为 `ghost`，与导航 secondary 进入工作台不抢主行动

## 1.3.5 — 2026-06-03

### 干预台与人设档案

- 主持干预台三键、发言气泡「重生成」、人设抽屉底栏与关闭钮改为 `Button`

## 1.3.4 — 2026-06-03

### 记忆审批面板

- `MemoryReviewPanel` 单条/批量入库操作改用 `Button`（ghost / secondary）

## 1.3.3 — 2026-06-03

### 首次向导与配置引导

- `OnboardingWizard`、`SetupGuidePanel` 全部改用 `Button`（含 `loading` 检查连接）

## 1.3.2 — 2026-06-02

### 议事厅视觉重构与统一按钮体系

- 新增 `docs/ui-principles.md` 与 `src/ui/`（`Button` / `Chip` / `IconButton`）五级按钮组件
- 样式分层：`tokens.css`、`components/buttons.css`、`layout/shell.css`、`landing.css` 由 `styles.css` 导入
- 工作台侧栏分组：项目 / 当前场景 / 任务 / 历史；底栏单一主行动「发起审议」
- 空会话：场景 chip 最多 5 个 +「更多」；主 CTA 与侧栏/顶栏遵守「一屏一 primary」
- 场景管理行操作改为溢出菜单；任务卡片层级与 `secondary` 新建任务
- 官网 `--lp-*` 与 workspace 色板对齐；标题 serif（LXGW WenKai）；探索区卡片样式收紧

## 1.3.1 — 2026-06-02

### 场景易用性与官网体验

- 内置场景支持**编辑（覆盖）/ 复制 / 删除（隐藏）/ 还原**；自定义场景完整增删改
- 新增官网与子页 **`/scenario-guide`**：如何编写场景（议题示例、自检清单）
- 场景管理内嵌编写提示与说明页入口；默认议题占位示例
- 修复官网无法纵向滚动；首页区块入场动效（尊重 `prefers-reduced-motion`）

## 1.3.0 — 2026-06-02

### 用户场景库（故事 A）

- 内置场景对齐四套审议预设；支持**新建 / 编辑 / 删除**自定义场景（议题骨架、预设、可选自定义席位）
- 侧栏与空会话以「审议场景」选型，不再仅限固定模板
- 场景可**导出 / 导入 JSON**，并同步到本地 `roundtable-projects/user-scenarios.json`

### 审议任务时间线（故事 B）

- 项目下可创建**审议任务**（标题、目标、状态），并设为当前任务
- 新发起的会议自动挂到当前任务；侧栏展示**第 1 场 → 第 N 场**时间线，可点击复盘
- 会议历史显示所属任务；旧会议无 `taskId` 仍保留在列表中

## 1.2.6 — 2026-06-02

### 证据矩阵导出

- 新增 `src/lib/evidenceMatrix.js`：按发言轮次与 Workspace 证据池生成对照行，支持 HTML / Markdown
- 完整 HTML 复盘包内嵌 `#evidence-matrix` 区块；完成态可单独「导出证据矩阵 (HTML)」

### 会议历史搜索

- 项目侧栏「会议历史」在 3 场以上时显示搜索框，按议题或标题过滤
- 过滤逻辑抽取为 `src/lib/historyFilter.js`（`filterMeetings`）

### 议题模板库

- 新增 `src/data/topicTemplates.js`（产品、商业、技术路线、合作条款、增长实验、复盘等 6 类）
- 空会话在 starter 卡片旁提供「议题模板」快捷填入，可联动预设

## 1.2.5 — 2026-06-02

### 官网文案与 1.2.x 能力对齐

- 首页、审议流程、常见问题、适用场景（中英）补充：结果一览、单轮重生成与重算收束、证据可信度策略、继续审议阅读顺序
- 版本号与 `RELEASE_NOTES` 更新至 1.2.5

## 1.2.4 — 2026-06-02

### 首次成功向导打磨

- 欢迎与「首场审议」文案对齐 1.2.x 能力（结果一览、继续审议、证据标注、单轮重生成）
- 验证连接：检查中状态、上次检查时间；启动已配置时自动显示就绪；失败时展示明确错误
- 配置步骤补充 API Key 仅服务端读取的隐私说明
- 修复已配置模型时第 4 步向导不显示的问题；演示/真实审议完成时收起向导
- 新增 `useOnboarding.test.js` 覆盖 `shouldShow` 逻辑

## 1.2.3 — 2026-06-02

### 审议完成态后续动作

- **继续审议**（`ContinueDeliberationPanel`）上移至结果一览与导出之后、「完整审议记录」之前
- 新增「后续动作」分区标签，完成态阅读顺序：结果一览 → 导出 → 继续审议 → 完整记录
- 面板文案与产品用语对齐（继续审议 / 本场结论注入）

## 1.2.2 — 2026-06-02

### 审议完成态可读性

**结果一览面板**（`DeliberationOutcomePanel`）
- 审议结束后顶部四格摘要：已定路径、仍待澄清、下一步行动、带走成果
- 完整 Workspace / Decision Packet / 投票置于「完整审议记录」分区之下
- 导出操作紧接一览面板；完成时自动滚入结果区

**导出安全**（`formatMeetingHTML` / `formatMeetingMarkdown`）
- 分歧 `status`、投票 `vote` 写入 HTML 前白名单校验，阻断分享载荷中的属性注入
- 角色色与认知动作色经 `sanitizeCssColor`；`act` 标签转义
- Markdown 引用仅保留 http(s) 链接

## 1.2.1 — 2026-06-02

### 会议迭代延伸 + 可信度 + 首次成功路径

**证据可信度** (`server/evidence.js`)
- 无用户材料时：剥离无源 URL，`fact` / `user_input` 自动降级为 `inference`
- 有用户材料时：仅保留议题/上下文中出现的 URL
- 导出纪要增加「证据溯源说明」

**会议迭代闭环**
- `POST /api/meetings/refresh-closure`：重生成发言后可重算投票、Decision Packet（不重写 turns）
- 完成态「重算投票与 Decision Packet」

**审议治理**
- 任意角色 `PROBE` 可写入 `openQuestions`（修复 Surface 侧栏空白）

**首次成功向导**
- 工作台四步：欢迎 → 配置 → 验证连接 → 演示/首场审议

**可维护性**
- `tests/golden-path.test.js`：健康检查 → 生成 → 证据策略 → 收束重算

## 1.2.0 — 2026-06-02

### 会议迭代（实质能力模块）

- **单轮发言重生成**：审议完成后，可对任意一轮保留前后文、仅替换该角色当次发言；Workspace 按全文重新演化。
- API：`POST /api/meetings/regenerate-turn`（`meeting` + `turnIndex` + 议题上下文）。
- 工作台：每条发言气泡提供「重生成」；支持撤销上一次重生成。
- 不含：整场重跑、改预设后批量重生成、多模型投票选稿。

## 1.1.4 — 2026-06-02

- Landing navigation: dedicated pages for scenarios, workflow, FAQ, and release notes (`/scenarios`, `/workflow`, `/faq`, `/updates`).
- Browser back/forward works via History API; each sub-page has「返回首页」and expanded intro copy.
- Updates page lists notable releases (not the external roadmap link).

## 1.1.3 — 2026-06-02

- Landing v2: single-column hero (no floating product card), one screenshot strip, ink/brown palette without grid texture or green SaaS accents.
- Remove preview checklist under image; merge install + principles; shorten headline copy.

## 1.1.2 — 2026-06-02

- Redesign landing page: editorial copy in Chinese, remove AI-product clichés (English badges, Decision Packet hero, ChatGPT framing).
- New landing palette (stone paper + forest accent), Noto Serif SC / Source Sans 3, scenario strip and calmer preview panel.

## 1.1.1 — 2026-06-02

- Fix history meeting cards: override `.btn` `nowrap` so titles wrap instead of clipping; show user topic as primary line.
- Fix Session Workspace sidebar: only list `open` tensions under unresolved; wrap long text and clip with hover title.

## 1.1.0 — 2026-06-02

- Add `docker-compose.yml` for one-command self-hosted deployment.
- Document the five-release upgrade path in this changelog.

## 1.0.9 — 2026-06-02

- Click a seat during playback to focus on one speaker; other bubbles dim until cleared.
- Meeting history shows saved time, turn count, and demo badge.

## 1.0.8 — 2026-06-02

- Wire `buildContinuationContext` into the completion UI: continue deliberation with prior conclusions injected.
- Share `startMeeting` path for normal and continuation meetings.

## 1.0.7 — 2026-06-02

- Evidence labels use distinct colors and tooltips (fact, inference, assumption, opinion, project memory, user input).

## 1.0.6 — 2026-06-02

- In-app setup guide when API Key is missing: copy minimal `.env` snippet and `npm run doctor` hint.