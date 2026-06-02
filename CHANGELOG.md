# Changelog

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