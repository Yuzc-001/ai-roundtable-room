# AI Roundtable Intelligence / AI 圆桌智库

[English](./README_EN.md) | **简体中文**

一个可本地运行、可公开部署、工业级审议逻辑的 AI 圆桌会议应用。

---

## 🌟 核心亮点

*   **结构化审议 (Structured Deliberation)**：并非简单的角色扮演，而是基于 6 个阶段（定调、发散、暴露、质询、收拢、裁定）的深度治理逻辑。
*   **多模型资源池**：支持 OpenAI, Claude, DeepSeek, 智谱 GLM 等。可让不同角色使用不同模型，实现算力与成本的最佳平衡。
*   **多模态增强 (PDF 支持)**：支持直接拖入 PDF 报告作为审议背景，AI 自动解析并基于真实数据进行证据化讨论。
*   **项目记忆系统**：审议后的结论、风险、分歧可一键「审批入库」，并在下一场会议中作为历史背景自动加载。
*   **在线分享与协作**：一键生成加密分享链接。接收者不仅可以查看，还能通过「存入我的智库」将整场审议及记忆导入本地。
*   **Token 成本透明**：实时展示每一场审议的 Token 消耗及分类统计，完美适配 SaaS 商业化心智。

---

## 快速启动

Windows：

```bat
start.bat
```

macOS / Linux：

```bash
bash start.sh
```

首次运行脚本会自动把 `.env.example` 复制成 `.env`。打开 `.env` 后，最少填写：

```bash
AI_PROVIDERS=openai
OPENAI_API_KEY=你的 API Key
OPENAI_MODEL=gpt-4o  # 推荐使用性能较强的模型
```

启动后打开：`http://127.0.0.1:5173`

## 核心功能详解

### 1. 结构化情报面板
在会议过程中，右侧面板会实时演化出当前的：
- **候选方案库**：AI 自动提取的潜在决策点。
- **开放问题**：阻塞决策的关键疑问。
- **分歧池**：不同专家之间的核心冲突点及立场。
- **证据链**：所有主张的来源（事实、推论或项目记忆）。

### 2. Decision Packet (决策包)
审议结束时，主持人会封装一份完整的决策包，包含：
- **少数派报告**：保留那些不被采纳但极具风险的异议。
- **重开条件**：在什么情况下需要重新审议。
- **行动项**：明确的 Owner 和下一步动作。

### 3. 多模型配置
圆桌支持非常灵活的路由：
```bash
# 全局轮流使用
AI_PROVIDERS=deepseek,openai,glm

# 指定角色分工
ROLE_PROVIDERS=li:deepseek,heng:openai,che:glm
```

## 环境诊断

运行 `npm run doctor` 检查环境：
- `.env` 读取状态
- API Key 有效性校验
- 访问控制配置
- 每日生成限流状态

## 生产运行

```bash
npm run build
npm run start
```

公开部署建议开启 `APP_ACCESS_CODE` 保护模型额度。

## 验证

```bash
npm run check  # 包含 66+ 自动化测试用例、生产构建校验及安全审计
```

## 维护入口

- 架构设计：[docs/architecture.md](docs/architecture.md)
- 路线图：[docs/roadmap.md](docs/roadmap.md)
- 贡献约定：[CONTRIBUTING.md](CONTRIBUTING.md)
- 许可证：MIT
