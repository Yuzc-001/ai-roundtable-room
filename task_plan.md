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

## Current Productization Targets
- New user can copy/fill `.env` without guessing.
- One-command startup works on Windows and Unix.
- App explains demo mode, missing API keys, auth, and generation failures clearly.
- Real generated meetings can be continued or refined without starting from zero.
- Export and history are useful after a real meeting.
- README describes a believable local and production path.

## Implementation Plan
- `docs/superpowers/plans/2026-05-17-productization.md`

## Errors Encountered
| Error | Attempt | Resolution |
|---|---|---|
| Codex in-app browser does not support download events | Tried to wait for a download after clicking export | Export content is covered by unit tests; browser page recovered and had no console errors |
