<p align="center">
  <a href="./README.md">中文</a> · <a href="./README.en.md">English</a>
</p>

# AI Roundtable Room

AI Roundtable Room is a local-first, deployable workspace for structured AI deliberation. It sends a complex question through multiple AI roles, guides the discussion through explicit phases, produces a Decision Packet with risks, dissent, actions, and reopen conditions, and keeps approved findings in project memory.

![AI Roundtable Room preview](./artifacts/home-idle.png)

## Visual Explainer

Watch the 24-second project explainer: [roundtable-explainer.mp4](./artifacts/roundtable-explainer.mp4)

```bash
npm run video:studio  # Open Remotion Studio
npm run video:render  # Render artifacts/roundtable-explainer.mp4
```

## When to Use It

- Product and engineering reviews where you need tradeoffs, objections, and launch conditions.
- Business, writing, legal, and brainstorming work where the output needs to become a reviewable decision artifact.
- Project-level AI discussions that should remember prior conclusions, risks, and actions.
- Local model-key custody, with API keys kept on the server instead of exposed to the browser.

## Core Capabilities

- **Structured deliberation**: Built-in protocols for product review, writing workshop, legal consultation, and brainstorming.
- **Multi-role roundtable**: Each role has its own perspective, information focus, and speaking responsibility.
- **Project memory**: Decisions, risks, actions, and disagreements can be stored per project and reused in later meetings.
- **Decision Packet**: Produces the selected option, evidence, minority report, residual objections, reopen conditions, and action items.
- **File context**: Upload a PDF report and use the extracted text as meeting context.
- **Export and sharing**: Export Markdown or HTML minutes, or generate an online review link.
- **Provider pool**: Supports OpenAI-compatible providers and the Claude Messages API. Multiple providers can be configured, and specific roles can be pinned to specific providers.
- **Public access protection**: Optional access code, HttpOnly session cookie, and daily generation limit.

More UI context: [live deliberation screenshot](./artifacts/live-meeting.png).

## Tech Stack

- React 19 + Vite 7
- Node.js 22 + Express 5
- Vitest
- OpenAI SDK
- `pdf-parse` for PDF text extraction

## Quick Start

Windows:

```bat
start.bat
```

macOS / Linux:

```bash
bash start.sh
```

On the first run, the script copies `.env.example` to `.env`. Open `.env` and fill at least:

```bash
AI_PROVIDERS=openai
OPENAI_API_KEY=your-api-key
OPENAI_BASE_URL=
OPENAI_MODEL=gpt-5.5
```

If you use a proxy or an OpenAI-compatible provider, set the matching `BASE_URL` and a supported `MODEL`. Then open:

```text
http://127.0.0.1:5173
```

Without an API key, the app still opens with a demo deliberation. Real meetings are generated after you configure an API key and restart the server.

## Manual Start

```bash
npm install
copy .env.example .env
npm run doctor
npm run dev
```

On PowerShell, macOS, or Linux, manually copy `.env.example` to `.env`, then run the same `doctor` and `dev` commands.

## Configuration Check

```bash
npm run doctor
```

`doctor` checks:

- Whether `.env` was loaded
- The active providers and models
- Whether API keys are configured
- Whether access protection is enabled
- What configuration is still missing

## Multi-Provider Setup

The app uses a provider pool. With one provider, every role uses that provider. With multiple providers, roles rotate through the configured providers.

```bash
AI_PROVIDERS=openai,deepseek,glm

OPENAI_API_KEY=your-openai-key
OPENAI_MODEL=gpt-5.5

DEEPSEEK_API_KEY=your-deepseek-key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat

GLM_API_KEY=your-glm-key
GLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4
GLM_MODEL=glm-4.5
```

Pin selected roles to specific providers:

```bash
ROLE_PROVIDERS=li:deepseek,heng:openai,che:glm
```

Claude Messages API:

```bash
AI_PROVIDERS=claude
CLAUDE_TYPE=claude
CLAUDE_API_KEY=your-claude-key
CLAUDE_BASE_URL=https://api.anthropic.com
CLAUDE_MODEL=claude-sonnet-4-5-20250929
```

Custom OpenAI-compatible provider:

```bash
AI_PROVIDERS=custom1
CUSTOM1_API_KEY=your-key
CUSTOM1_BASE_URL=https://your-openai-compatible-host/v1
CUSTOM1_MODEL=your-model
```

## Production

```bash
npm run build
npm run start
```

The production server reads `PORT` and `HOST`. By default, production listens on `0.0.0.0:5173`; local development listens on `127.0.0.1:5173`.

For public deployments, set:

```bash
APP_ACCESS_CODE=your-private-code
SESSION_SECRET=your-long-random-secret
DAILY_MEETING_LIMIT=80
```

`APP_ACCESS_CODE` is exchanged once for a signed HttpOnly session cookie. The generation endpoint does not repeatedly send the access code. `DAILY_MEETING_LIMIT` limits how many real meetings a single IP can generate per day.

## Docker

```bash
docker build -t ai-roundtable-room .
docker run --rm -p 5173:5173 --env-file .env ai-roundtable-room
```

You can also pass environment variables directly:

```bash
docker run --rm -p 5173:5173 -e AI_PROVIDERS=claude -e CLAUDE_API_KEY=your-key ai-roundtable-room
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server, with Express and Vite in one Node process |
| `npm run doctor` | Check `.env`, providers, models, and access-control settings |
| `npm test` | Run Vitest tests |
| `npm run build` | Build frontend production assets |
| `npm run start` | Start the production server |
| `npm run check` | Run tests, build, and `npm audit --audit-level=moderate` |

## Project Layout

```text
server/                 Express server, model providers, sessions, rate limits, meeting generation
src/                    React frontend, UI components, export logic, browser API calls
shared/personas.js      Shared personas and deliberation protocols
docs/                   Architecture, security audit, roadmap, and product notes
artifacts/              Screenshots used by README and demos
roundtable-projects/    Local project snapshots maintained at runtime
```

## Maintainer Links

- Architecture: [docs/architecture.md](docs/architecture.md)
- Security audit: [docs/security-audit.md](docs/security-audit.md)
- Roadmap: [docs/roadmap.md](docs/roadmap.md)
- Contributing: [CONTRIBUTING.md](CONTRIBUTING.md)

## License

MIT
