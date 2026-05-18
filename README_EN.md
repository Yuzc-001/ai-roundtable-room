# AI Roundtable Intelligence / AI 圆桌智库

**English** | [简体中文](./README.md)

A production-ready AI roundtable deliberation application with industrial-grade reasoning logic.

---

## 🌟 Key Features

*   **Structured Deliberation**: Not just simple roleplay. Driven by a deep governance logic across 6 stages (Framing, Divergence, Surface, Examination, Convergence, and Decision).
*   **Multi-Model Resource Pool**: Supports OpenAI, Claude, DeepSeek, Zhipu GLM, and more. Assign different models to different roles to balance reasoning power and cost.
*   **Multimodal Depth (PDF Support)**: Drag and drop PDF reports as context. The AI automatically parses and deliberates based on real evidence and facts.
*   **Project Memory System**: Deliberation outcomes, risks, and tensions can be "approved" into a long-term project memory, automatically injected into future meetings.
*   **Online Sharing & Collaboration**: Generate encrypted sharing links instantly. Recipients can view the deliberation or use "Save to My Library" to import the entire session and memory locally.
*   **Token & Cost Transparency**: Real-time display of token consumption and detailed stats for every deliberation, perfectly aligned with SaaS commercial expectations.

---

## Quick Start

Windows:

```bat
start.bat
```

macOS / Linux:

```bash
bash start.sh
```

The script will automatically copy `.env.example` to `.env`. Open `.env` and fill in at least:

```bash
AI_PROVIDERS=openai
OPENAI_API_KEY=your-api-key
OPENAI_MODEL=gpt-4o  # Strong models recommended
```

Open: `http://127.0.0.1:5173`

## Deep Dive into Core Features

### 1. Structured Intelligence Panel
During a session, the right panel evolves in real-time with:
- **Candidate Options**: Potential decision points extracted by AI.
- **Open Questions**: Critical uncertainties blocking the decision.
- **Tension Pool**: Core conflicts and stances between different experts.
- **Evidence Chain**: Sources of all claims (Facts, Inferences, or Project Memory).

### 2. Decision Packet
At the end of a deliberation, the Moderator encapsulates a complete Decision Packet containing:
- **Minority Report**: Preserving high-risk objections that were not adopted.
- **Reopen Conditions**: Specific scenarios that require a new deliberation.
- **Action Items**: Clear owners and next steps.

### 3. Multi-Model Routing
Flexible routing for advanced users:
```bash
# Global round-robin
AI_PROVIDERS=deepseek,openai,glm

# Role-specific assignment
ROLE_PROVIDERS=li:deepseek,heng:openai,che:glm
```

## Environment Diagnosis

Run `npm run doctor` to check your setup:
- `.env` reading status
- API Key validity
- Access control configuration
- Daily generation limits

## Production Deployment

```bash
npm run build
npm run start
```

For public deployment, enable `APP_ACCESS_CODE` to protect your model credits.

## Verification

```bash
npm run check  # Runs 66+ automated tests, production build check, and security audit.
```

## Maintenance & Resources

- Architecture: [docs/architecture.md](docs/architecture.md)
- Roadmap: [docs/roadmap.md](docs/roadmap.md)
- Contributing: [CONTRIBUTING.md](CONTRIBUTING.md)
- License: MIT
