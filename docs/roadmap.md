# 用户视角优化路线

## 已做

- **v1.2.1（2026-06-02）**：证据强制模块；收束重算 API；PROBE→openQuestions 治理修复；首次成功向导；黄金路径测试。
- **v1.2.0（2026-06-02）**：单轮发言重生成 + 撤销。
- **v1.0.6–1.1.0（2026-06-02）**：UI 内首次配置引导（复制最小 `.env`）；证据标签视觉区分与 tooltip；完成态「继续追问」接入 `buildContinuationContext`；回放时席位聚焦过滤；历史会议元数据；`docker-compose.yml` 与 `CHANGELOG.md`。
- 项目目录改为 `ai-roundtable-room`，和包名、镜像名一致。
- 自动读取 `.env`，降低首次运行困惑。
- 增加 `npm run doctor`，快速检查运行配置。
- 共享人设数据迁到 `shared/personas.js`，前后端边界更清楚。
- `.env.example` 改成最小可用配置优先，明确 API Key、Base URL、模型名填写位置。
- 快速启动脚本成为 README 的首选启动路径。
- 会议结束后支持基于上一场结论继续追问。
- 右侧增加最近真实会议历史入口，可恢复会议并导出纪要。
- 纪要导出补充上下文、模型来源、生成来源和引用。
- 常见模型调用失败会区分 API Key、模型名、额度和 Base URL/网络问题。

## 下一阶段

1. 首次使用引导
   - 在 UI 内提供一键复制最小 `.env` 的入口。
   - 未配置 API Key 时，可以直接从界面看到下一步配置说明。

2. 会议迭代体验
   - **v1.2.0**：单轮发言重生成 + 撤销。
   - **v1.2.1**：收束重算（投票 / Decision Packet）。
   - 待做：整场重跑、按阶段批量重生成、生成中暂停/改向。

3. 结果可信度
   - **v1.2.1**：服务端证据强制 + 导出溯源说明。
   - 待做：检索源接入、导出证据矩阵 HTML。

4. 公开分发
   - 增加可选账号体系或更正式的访问控制。
   - 增加部署模板，如 Render、Fly.io、Railway、Vercel Node adapter。

5. 可维护性
   - 引入端到端测试，覆盖打开页面、补充背景、导出纪要。
   - 抽出 provider adapter，方便将 OpenAI 替换为其他兼容模型服务。

---

**当前跟踪 (2026-05-24)**: 详细可执行计划见 `docs/superpowers/plans/2026-05-24-review-followup.md`（基于 2026-05-24 全面审查报告）。战略决策（含 A+E 升级路径）见 `docs/strategic-decisions.md`。本路线图的“下一阶段”5 项状态已在 progress.md + 新计划中建立 living tracking。
**2026-05-25 update**: Phase 0 of 2026-05-25-professional-upgrade.md (语言/可信度 tone) completed (ee397ddb); see progress.md for execution + Roadmap Status refresh on items 1/3. Surface language now professional; protected DNA intact. Phase 1 CSS gated.
