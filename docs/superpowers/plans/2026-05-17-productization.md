# Productization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make AI Roundtable Room feel like a real usable local/deployable product instead of a demo.

**Architecture:** Keep the existing React + Express architecture. Improve product usability through focused changes to setup files, public diagnostics, frontend continuation/history flows, and markdown export.

**Tech Stack:** React 19, Vite, Express 5, Vitest, OpenAI-compatible and Claude-compatible model providers.

---

## File Map

- Modify `.env.example`: make the first screen a minimal fill-in template and move advanced providers below it.
- Modify `README.md`: make scripts the primary startup path and document production deployment.
- Modify `server/doctor.js`: print actionable setup diagnosis.
- Modify `server/app.js`: classify common provider failures into safe public reasons.
- Modify `src/services/roundtableApi.js`: translate new backend reasons into user-facing Chinese messages.
- Modify `src/lib/roundtable.js`: add continuation context builder used by the UI and tests.
- Modify `src/lib/roundtable.test.js`: cover continuation context.
- Modify `src/lib/minutes.js`: enrich exported minutes.
- Modify `src/lib/minutes.test.js`: cover enriched export.
- Modify `src/App.jsx`: add history restore, clearer demo state, and continue-from-last-meeting flow.
- Modify `styles.css`: style history and status affordances.
- Modify `task_plan.md`, `findings.md`, `progress.md`: keep work state current.

## Task 1: Behavior Tests

**Files:**
- Modify: `src/lib/roundtable.test.js`
- Modify: `src/lib/minutes.test.js`
- Modify: `server/app.test.js`

- [x] Add a test for `buildContinuationContext` that includes the prior topic, vote summary, risks, actions, one speaker line, and optional user follow-up.
- [x] Add a test for `formatMeetingMarkdown` that expects context notes, provider label, source label, citations, and generated timestamp.
- [x] Add backend route tests for provider auth and rate-limit errors using an injected `generateMeeting` that throws status-coded errors.
- [x] Run the targeted tests and confirm they fail for missing behavior.

## Task 2: Backend Diagnostics

**Files:**
- Modify: `server/app.js`
- Modify: `src/services/roundtableApi.js`
- Modify: `server/doctor.js`

- [x] Add `classifyGenerationError(error)` in `server/app.js`.
- [x] Return `provider_auth_error`, `provider_model_error`, `provider_rate_limit`, or `provider_connection_error` for recognizable provider failures.
- [x] Add matching Chinese messages in `src/services/roundtableApi.js`.
- [x] Update `server/doctor.js` output with clear next steps for missing `.env`, missing API key, and configured providers.
- [x] Run the backend route tests and doctor command.

## Task 3: Continuation And History UI

**Files:**
- Modify: `src/lib/roundtable.js`
- Modify: `src/App.jsx`
- Modify: `styles.css`

- [x] Implement `buildContinuationContext`.
- [x] Refactor meeting generation in `App.jsx` so a normal meeting and a continuation meeting share the same request path.
- [x] Add a visible history section in the right column with restore buttons.
- [x] Add completed-meeting actions for replay, continue, and export.
- [x] Make demo mode and missing-key state clearer in the right column.
- [x] Run roundtable helper tests.

## Task 4: Export And Setup Polish

**Files:**
- Modify: `src/lib/minutes.js`
- Modify: `src/App.jsx`
- Modify: `.env.example`
- Modify: `README.md`
- Modify: `start.bat`
- Modify: `start.sh`

- [x] Enrich markdown minutes with metadata, context, citations, risks, actions, and provider/source labels.
- [x] Pass context notes and provider label from `App.jsx` into export.
- [x] Rewrite `.env.example` around the minimum required fields first.
- [x] Rewrite README quick start around `start.bat` and `bash start.sh`.
- [x] Adjust script messages only where they help first-time users.
- [x] Run minutes tests.

## Task 5: Full Verification

**Files:**
- No additional planned source edits.

- [x] Run `npm run doctor`.
- [x] Run `npm test`.
- [x] Run `npm run build`.
- [x] Start the local app.
- [x] Open the local app in a browser and inspect the first viewport and main flows.
- [x] Update planning files with final status.
