# AI Roundtable Productization Plan

## Goal
Turn the project into a genuinely usable local/deployable AI roundtable product, focused on first-run setup, real model generation, useful failure diagnosis, meeting iteration, export, and product polish.

## Scope Boundaries
- Keep changes simple and directly tied to product usability.
- Do not add accounts, databases, billing, or unrelated platform features.
- Prefer existing React/Express structure.
- Preserve the one-provider-pool model unless code inspection proves it blocks usability.

## Phases

1. Context and readiness audit - in_progress
2. Product design proposal - complete
3. User approval checkpoint - complete
4. Implementation plan - complete
5. Focused implementation - complete
6. Verification and product smoke test - complete
7. Final handoff - complete
8. Review Follow-up (2026-05-24) - documentation fidelity, A+E capture, audit hygiene, living roadmap (this plan)

## Current Productization Targets
- New user can copy/fill `.env` without guessing.
- One-command startup works on Windows and Unix.
- App explains demo mode, missing API keys, auth, and generation failures clearly.
- Real generated meetings can be continued or refined without starting from zero.
- Export and history are useful after a real meeting.
- README describes a believable local and production path.

## Implementation Plan
- `docs/superpowers/plans/2026-05-17-productization.md` (productization pass)
- `docs/superpowers/plans/2026-05-24-review-followup.md` (2026-05-24 comprehensive review follow-up: documentation fidelity, A+E decision capture, audit hygiene, living roadmap tracking)
- `docs/superpowers/plans/2026-05-25-professional-upgrade.md` (2026-05-25 Professional 质感 Upgrade: surface-only language/tone, typography/alignment polish, credibility layer amplification of existing primitives per the validated e0751cfc strategy — strictly gated, A+E compliant, working system protected)
  - Phase 0 (Language & Credibility Tone) executed 2026-05-25 (ee397ddb): 4 smallest text fixes + test; all gates/verifs passed; living docs updated; Phase 1/2 gated.
- 2026-05-30 Product Reinvention continuation (per docs/product-reinvention-goal-2026-05-30.md user directive): completion-state action panel + memory approval copy (App.jsx/components.jsx/styles.css surface only; 71 tests/build/check/doctor green; protected memory gate 100%; browser golden path ready). See progress.md for details + file:lines.

## Errors Encountered
| Error | Attempt | Resolution |
|---|---|---|
| Codex in-app browser does not support download events | Tried to wait for a download after clicking export | Export content is covered by unit tests; browser page recovered and had no console errors |
