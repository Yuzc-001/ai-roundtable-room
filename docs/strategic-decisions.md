# Strategic Decisions

> This document records major architectural and product strategy choices that are not obvious from the code or day-to-day plans. It exists to help future contributors (human or agent) understand the "why" behind the project's shape.

## Upgrade Paths: A (Extreme Local Professional Workbench) + E (Hybrid Optional Sync/Collaboration Layer)

**Date captured**: 2026-05-24 (from 2026-05-24 comprehensive project review + cross-session memory)

**Decision**:
The project deliberately follows a combined upgrade path:
- **A — Extreme local professional workbench**: Prioritize local-first excellence, zero-account, full privacy (API keys never leave the server), strong self-documentation, rigorous testing culture, and a structured deliberation experience (not chat). The core differentiators must be protected and deepened before anything else.
- **E — Hybrid optional sync/collaboration layer**: Only after local excellence is solid and the "toy" gaps are systematically closed should optional, user-initiated collaboration/sync features be considered. Never add accounts, cloud sync, or shared state as default or early features.

**Rationale** (preserved from the originating analysis):
- Preserve the product's unique value: local privacy, zero friction for solo/power users, structured multi-perspective decision packets that can be reviewed, continued, and persisted per project.
- Avoid the common failure mode of early platform features (accounts, billing, multi-user sync) that dilute the local-first experience and introduce complexity/security surface before the core product is mature.
- The project-memory system (roundtable-projects/ JSON+MD snapshots + human approve gate + UI injection) is a direct embodiment of Path A: it gives "project-level" continuity and memory without any server-side shared state.

**Current embodiment in code** (verified 2026-05-24):
- All state lives in localStorage (browser) + `roundtable-projects/` filesystem (server-visible but fully local).
- No accounts, no remote user model, no shared database.
- Strong test coverage (71+ tests) and self-documenting artifacts (this file, architecture.md, plans, review reports).
- Project as first-class entity with persistent memory, risks, actions, and human-in-the-loop approval — exactly the kind of professional local tooling Path A calls for.
- Provider configuration remains fully local and flexible (multiple OpenAI-compatible endpoints).

**Consequences of this choice**:
- New contributors or agents may be surprised that "obvious" collaboration features are absent or low priority.
- Documentation (including this file) must explicitly call out the A+E framing so the absence of accounts/sync is understood as intentional strategy, not missing functionality.
- Future E-path work must be explicitly gated behind "local excellence complete" criteria and user demand.

**References**:
- 2026-05-24 comprehensive project review report (exec summary item 6 + 计划忠实度 section) — identified the complete absence of this decision in the repo as the single highest fidelity gap.
- Original cross-session analysis that selected A+E as the target upgrade combination.
- `docs/roadmap.md` "下一阶段" item 4 (公开分发) and improvement-proposal.md (project memory vision) — both should be read with the A+E lens.
- `docs/superpowers/plans/2026-05-24-review-followup.md` Task 1 — explicit action to expand and maintain this record.

**Status**: Captured 2026-05-24. This is the authoritative source until updated with new rationale or scope changes. Any future shift toward heavier E-path work must update this section with the triggering decision and trade-off analysis.

**Follow-up verification (2026-05-24 plan execution)**: Confirmed file content matches review intent and plan Task 1 spec. Cross-checked against code (project memory in roundtable.js + App.jsx + project-files.js + roundtable-projects/ snapshots) and updated architecture.md. No drift introduced. Architecture rewrite now references this decision record.

---

*Maintained as part of the project's self-documenting discipline. When in doubt about "why we don't have X yet", check this file first.*