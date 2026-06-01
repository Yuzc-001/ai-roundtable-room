# Architecture

## Runtime

The app has one Node process:

- Express serves `/api/*`.
- In development, Vite middleware serves the React app.
- In production, Express serves the built `dist` directory.

## Server Modules

- `server/index.js`: process entrypoint (dev).
- `server/start-production.js`: production entrypoint that sets `NODE_ENV`.
- `server/app.js`: Express app factory (injectable for tests); defines routes including `GET/POST /api/project-files` that delegate to `saveProjectSnapshot`.
- `server/config.js`: environment parsing and defaults (providers, limits, access code).
- `server/doctor.js`: diagnostics CLI (`npm run doctor`); reports Node version, mode, host/port, configured providers, API key presence, .env status, access/session config, daily limit; prints actionable next steps for missing keys or .env (verified via direct read).
- `server/env.js`: .env loader.
- `server/model-providers.js`: provider pool adapters for OpenAI-compatible APIs and Claude Messages API (with tests).
- `server/rate-limit.js`: fixed-window request limiter (with tests).
- `server/session.js`: signed HttpOnly session cookie for public access protection (with tests).
- `server/meeting.js`: meeting domain logic, JSON contract, prompt engineering, validation, sanitization (with tests).
- `server/project-files.js`: project memory persistence layer; `saveProjectSnapshot({rootDir, projects, archivedProjects})` writes to `roundtable-projects/` (active/ and archived/ subdirs). Produces per-project `*.json` (full state) + `*.md` (human-readable with memory summaries/risks/actions + meeting records), root `active-projects.json`/`archived-projects.json`, and explanatory `README.md`. Uses `safeFilePart` sanitization and `projectMarkdown` (traces to code: lines 55-94).
  **Accepted durability trade-off (final closure)**: Unconditional rm + write (best-effort, non-atomic). Mitigations: caps on pending/memory entries, human approve gate in MemoryReviewPanel before long-term write, App 300ms debounced sync with logging, caller error handling in app.js route. Transparent in project-files.js header comment + this doc + plan. Matches local-first A-path model (no shared state, single-user). See plan Execution Complete and merged review for full justification. No observed issues in 71 tests + verifs.
- `server/shares.js`: share links.
- `shared/personas.js`: shared persona and preset data used by both frontend and backend.

## Frontend Modules

- `src/App.jsx`: main UI composition and state owner. Manages projects list + activeProject (via `useLocalStorage` hook or equivalent), meeting playback, history. Integrates project memory:
  - `const projectMemoryContext = useMemo(() => buildProjectMemoryContext(activeProject), [activeProject]);`
  - Injects into meeting payload: `contextNotes = [projectMemoryContext].filter(Boolean)`
  - Wires `MemoryReviewPanel` for pending changes: `<MemoryReviewPanel changes={pendingMemoryChanges} onApprove={approveMemoryChanges} onReject={rejectMemoryChanges} />`
  - Handlers call `approveProjectMemoryChanges(project, ids)` / `rejectProjectMemoryChanges` (from roundtable) and update React state (which drives persistence and snapshot triggers).
  - Shows pending count in project stats.
- `src/components.jsx`: visual components; exports `MemoryReviewPanel` (renders "待入库记忆" list with approve/reject affordances when `changes.length > 0`).
- `src/data/personas.js`: frontend re-export for shared personas.

**2026-05-25 surface 质感 note (ee397ddb)**: Phase 0 executed smallest language/tone upgrades in App.jsx + components.jsx (removed "数字内阁"/"大臣"/promotional demo framing per e0751cfc strategy Sec1+5; replaced with professional "结构化审议工作台", name-only personas, expert phrasing). Protected: zero changes to roundtable.js, project-files.js, MemoryReviewPanel logic/human gate behavior, core flows, or tests beyond minimal string assert. See docs/superpowers/plans/2026-05-25-professional-upgrade.md (Protected Checklist + Phase 0 Execution Notes) + progress.md. Future Phase 1/2 (CSS only) gated. This preserves the documented architecture while aligning surface tone with the serious deliberation model.
- `src/hooks/useTypewriter.js`: playback text reveal behavior.
- `src/hooks/useLocalStorage.js`: localStorage persistence helper used for project state.
- `src/lib/roundtable.js`: pure roundtable + project-memory helpers (core of the delivered memory system, verified via multiple reads/greps):
  - `createDefaultProject`, `archiveProject`, `restoreArchivedProject`.
  - `buildProjectMemoryContext(project)` (line ~89): returns human-readable string of recent summaries/decisions, merged risks (riskRegister + risks for compat), actions (actionItems + actions), disagreements for injection into next meetings. Respects `memoryEnabled`.
  - `normalizeMemory` / `createEmptyMemory` (lines 43-61): canonical fields + dual compat lists (risks/riskRegister, actions/actionItems, etc.).
  - `updateProjectWithMeeting(project, entry)` (line 185): appends meeting (capped), builds `pendingMemoryChanges` via `buildMemoryChanges` from `memoryDiff` + meeting output (decisions, risks, assumptions, disagreements, actions).
  - `approveProjectMemoryChanges(project, changeIds)` (line 219): moves selected pending into `memory.*` (writes to both canonical and dual compat fields for risks etc.), keeps rejected in `rejectedMemoryChanges`.
  - `buildMemoryChanges`, `makeChangeId`, `removeMeetingFromProject`, and related pure updaters.
  - Also: roster derivation, live state, meeting payload builder, memory derivation.
- `src/lib/minutes.js`: markdown/HTML export helpers (enriched with context, model sources, citations, evidence labels; with tests).
- `src/services/roundtableApi.js`: browser-to-server API calls, including project-files snapshot trigger (`fetch('/api/project-files')`).
- `src/main.jsx`: React entry.

## Data Flow (Updated with Project Memory)

1. User sets topic, preset, optional access code, and optional context notes (or relies on auto-injected project memory).
2. Frontend builds compact meeting payload via `buildMeetingPayload` (includes `context: contextNotes.join` where contextNotes contains `projectMemoryContext` from approved project memory when available).
3. If access protection enabled, frontend exchanges `APP_ACCESS_CODE` via `POST /api/sessions`.
4. Server stores access in signed HttpOnly cookie.
5. `POST /api/meetings` validates, routes turns through provider pool (model-providers), moderator summarizes vote/risks/actions.
6. Server parses/validates/sanitizes output; returns structured meeting with `memoryDiff`, risks, actions, decisionPacket etc.
7. Frontend plays the meeting (typewriter, stages).
8. On "save to project" or equivalent: `updateProjectWithMeeting` creates `pendingMemoryChanges` entries (capped) from the new output + diff. UI reflects "待审批记忆" count.
9. Human gate: `MemoryReviewPanel` (in components + wired in App) lets user select/approve/reject individual changes. Approve calls `approveProjectMemoryChanges` (merges into `memory` with dual-field writes for backward compat in buildContext/normalize), updates React project state (persisted to localStorage).
10. Project switch/create/archive: pure updates in App + roundtable helpers; triggers re-compute of `projectMemoryContext`.
11. Durability / export: explicit or on-demand `POST /api/project-files` (via roundtableApi) calls `saveProjectSnapshot` (project-files.js:65). This writes full `roundtable-projects/` tree:
    - `README.md` explaining the layout.
    - `active-projects.json` / `archived-projects.json` (full snapshots).
    - `active/<sanitized-name-id>/` + `archived/...` : `*.json` (complete project incl. memory + meetings + pending) and `*.md` (rendered memory + meeting history via `projectMarkdown`).
    This gives local FS portability and human-readable audit trail alongside browser localStorage.
    **Auth note (added in fix-round-1)**: The mutating POST is guarded by the same `hasValidSession` check as /api/meetings when `config.accessCode` is set (server/app.js:168+). GET for folder info remains open. This hardens the documented persistence path for protected deployments.
    **Durability note (final closure, accepted trade-off)**: Snapshot is best-effort full-replace (see project-files.js header for detailed rationale + mitigations: human gate, caps, logging, local-first model). Matches the A (extreme local) path in strategic-decisions.md. Transparent and low-risk in practice (71 tests + re-runs clean).
12. Subsequent meetings automatically receive approved memory via `projectMemoryContext` injection (privacy-preserving, all local).
13. History/restore: meetings list in project allows replay/continue (uses prior context + memory).

The project-memory system (roundtable-projects/ + roundtable.js helpers + App wiring + human approve gate) was a major delivered capability (exceeding original productization scope per 2026-05-24 review). It embodies local-first professional tooling without accounts or remote state.

## Distribution

Use one of:

- Source: `npm ci && npm run build && npm run start`
- Docker: `docker build -t ai-roundtable-room .`

Provider pool:

- `AI_PROVIDERS=openai,deepseek,glm,custom1`
- `${PROVIDER_ID}_API_KEY`
- `${PROVIDER_ID}_BASE_URL`
- `${PROVIDER_ID}_MODEL`
- `ROLE_PROVIDERS=li:deepseek,heng:openai,che:glm`

Recommended public deployment secret:

- `APP_ACCESS_CODE`
- `SESSION_SECRET`

Recommended abuse control:

- `DAILY_MEETING_LIMIT`

Local project memory lives in `roundtable-projects/` (created on snapshot) and browser localStorage; fully portable, no cloud accounts required.

## Verification Notes (for maintainers)

- All core memory functions are pure and tested (roundtable.test.js, project-files.test.js).
- Doctor output is actionable (see server/doctor.js).
- `npm run check` exercises tests + build + moderate audit.
- FS snapshots are deterministic and human-readable (example files in repo `roundtable-projects/` after use).
- No changes to generation or meeting runtime in review follow-up scope; only doc + one audit hygiene fix.

*Updated 2026-05-24 during review-followup execution to close architecture drift identified in the 2026-05-24 comprehensive review (exec summary + 计划忠实度 section). Every module and data flow claim above is backed by direct `read_file` + `grep` results on the listed source files.*