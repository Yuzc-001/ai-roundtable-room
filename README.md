# AI 圆桌智库

[English](./README.en.md) | **简体中文**

把一个复杂问题交给多个 AI 角色审议，最后得到一份可以复查、继续追问、沉淀到项目里的决策包。

你不需要手动设计六个 prompt，也不需要在几段模型回答里来回拼结论。输入问题，选择审议协议，圆桌会让主持人、强观点、风险拆解、证据校准和用户视角按阶段推进。系统会保留分歧、证据状态、开放问题、风险和行动项。

![AI 圆桌智库首页](./artifacts/home-2026-05.png)

![AI 圆桌智库审议现场](./artifacts/deliberation-2026-05.png)

## 24 秒看懂

项目里带了一段 Remotion 可视化讲解视频：[roundtable-explainer.mp4](./artifacts/roundtable-explainer.mp4)

```bash
npm run video:studio
npm run video:render
```

## 适合什么场景

- 产品、技术、增长、商业判断：需要看到备选方案、反对意见、风险和上线条件。
- 写作、法律、咨询、复盘：需要不同视角互相挑战，而不是只要一段顺滑回答。
- 长期项目讨论：希望把确认过的结论、风险、分歧和行动项保存下来，下次继续用。
- 本地模型密钥托管：API Key 只在服务端读取，不暴露给浏览器。

## 这和直接问 ChatGPT 有什么不同

直接问一个模型，通常会得到一段答案。AI 圆桌智库更关注决策过程：谁提出了什么立场，哪些地方还没有证据，哪条分歧会影响选择，什么条件出现后需要重开讨论。

一次审议会经过定调、发散、暴露、质询、收拢和裁定。最后输出的 Decision Packet 包含采纳方案、少数派报告、残余风险、重开条件和行动项。你可以导出纪要，也可以把确认过的内容批准进项目记忆。

## 快速启动

Windows：

```bat
start.bat
```

macOS / Linux：

```bash
bash start.sh
```

首次运行脚本会把 `.env.example` 复制成 `.env`。至少填写：

```bash
AI_PROVIDERS=openai
OPENAI_API_KEY=你的 API Key
OPENAI_MODEL=gpt-5.5
```

启动后打开：

```text
http://127.0.0.1:5173
```

没有配置 API Key 时，页面仍然可以打开并查看演示审议；真实生成需要填好模型配置并重启服务。

## 模型配置

只用一个供应商时保持最小配置即可：

```bash
AI_PROVIDERS=openai
OPENAI_API_KEY=你的 API Key
OPENAI_BASE_URL=
OPENAI_MODEL=gpt-5.5
```

如果你使用 OpenAI 兼容服务，把 `BASE_URL` 和 `MODEL` 改成供应商支持的值。

多个供应商可以轮流分配给不同角色：

```bash
AI_PROVIDERS=openai,deepseek,glm

OPENAI_API_KEY=你的 OpenAI Key
OPENAI_MODEL=gpt-5.5

DEEPSEEK_API_KEY=你的 DeepSeek Key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat

GLM_API_KEY=你的智谱 Key
GLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4
GLM_MODEL=glm-4.5
```

也可以指定某些角色固定走某个供应商：

```bash
ROLE_PROVIDERS=li:deepseek,heng:openai,che:glm
```

Claude Messages API：

```bash
AI_PROVIDERS=claude
CLAUDE_TYPE=claude
CLAUDE_API_KEY=你的 Claude Key
CLAUDE_BASE_URL=https://api.anthropic.com
CLAUDE_MODEL=claude-sonnet-4-5-20250929
```

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 启动本地开发服务 |
| `npm run doctor` | 检查 `.env`、供应商、模型和访问控制 |
| `npm test` | 运行 Vitest 测试 |
| `npm run build` | 构建前端生产资源 |
| `npm run start` | 启动生产服务 |
| `npm run check` | 运行测试、构建和依赖审计 |
| `npm run video:studio` | 打开 Remotion 视频编辑预览 |
| `npm run video:render` | 渲染项目讲解视频 |

## 公开部署

生产启动：

```bash
npm run build
npm run start
```

公开部署时建议设置访问码和会话密钥，避免别人消耗你的模型额度：

```bash
APP_ACCESS_CODE=你的访问码
SESSION_SECRET=一段足够长的随机字符串
DAILY_MEETING_LIMIT=80
```

Docker：

```bash
docker build -t ai-roundtable-room .
docker run --rm -p 5173:5173 --env-file .env ai-roundtable-room
```

## 项目结构

```text
server/                 Express 服务、模型供应商、会话、限流和会议生成
src/                    React 前端、界面组件、导出逻辑和浏览器 API 调用
shared/personas.js      前后端共用的人设和审议协议
remotion/               可视化讲解视频源码
public/remotion/        Remotion 渲染用静态图片
artifacts/              README 截图和讲解视频
docs/                   架构、安全审计、路线图和产品说明
roundtable-projects/    本地运行时保存的项目快照
```

## 维护入口

- 架构设计：[docs/architecture.md](docs/architecture.md)
- 安全审计：[docs/security-audit.md](docs/security-audit.md)
- 路线图：[docs/roadmap.md](docs/roadmap.md)
- 贡献约定：[CONTRIBUTING.md](CONTRIBUTING.md)

## 许可证

MIT
