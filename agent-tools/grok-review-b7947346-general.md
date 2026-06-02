> **Fix round 2026-06-02:** Priority fixes shipped. Tracker: `grok-review-b7947346.md`.

# General Code Review — UI Refactor 1.3.2

**Scope:** commit `4cb4c11` (`feat(ui): 1.3.2 议事厅视觉重构与统一按钮体系`)  
**Summary ref:** `agent-tools/impl-summary-b7947346.md`  
**Reviewer focus:** code quality, bugs, Button/Chip consistency, CSS imports, `App.jsx` structure, a11y, one-primary-per-viewport  
**Date:** 2026-06-02

---

## Executive summary

The refactor delivers a credible design system (`src/ui/*`, `tokens.css`, split stylesheets) and passes the full test/build pipeline. High-traffic workbench paths are wired to `Button` / `Chip` / `IconButton`, and playback-aware gating for the top-bar primary is implemented correctly (`showWorkbenchPrimary = playbackStarted`).

The main gaps are **(1) “one primary per viewport” is documented and claimed in the changelog but violated in several real layouts**, **(2) partial migration leaves many raw `btn btn-*` controls with divergent a11y behavior**, and **(3) a few CSS/a11y defects** (invalid `rgba(var(--bg))`, menu/dialog patterns). None of these block the build; they affect UX hierarchy, accessibility, and long-term maintainability.

### Verification

| Check | Result |
|-------|--------|
| `npm test` | 26 files, **147 passed** |
| `npm run build` | **success** (Vite) |
| `src/ui/Button.test.jsx` | variant/loading/size smoke only |

---

## Issues

### Issue 1 [General] — Severity: bug

- **File**: `src/App.jsx:1142-1153`, `src/App.jsx:1345-1354`
- **Description**: In the idle workbench (`!playbackStarted`), two `variant="primary"` buttons are visible at once: sidebar foot **「发起审议」** and empty-session **「启动结构化审议」** / **「查看演示审议」**. `docs/ui-principles.md` checklist asks “该屏是否只有一个 primary?” and `CHANGELOG.md` states empty + sidebar obey one-primary; in practice the user sees **two navy primary CTAs** on desktop.
- **Suggestion**: Pick a single owning region for the idle primary (e.g. empty-session only) and demote the sidebar CTA to `secondary` or `ghost`, or hide sidebar primary when the empty hero is in view. Align copy via shared `primaryActionLabel`.
- **Status**: fixed
- **Response**: Addressed in fix round 2026-06-02 — see `grok-review-b7947346.md`.
### Issue 2 [General] — Severity: bug

- **File**: `src/App.jsx:1038-1041`, `src/App.jsx:1142-1153`
- **Description**: With **「+ 新建」** project form open, the sidebar simultaneously shows **`btn-primary`「创建」** and **`variant="primary"`「发起审议」** — two primaries in the same sidebar foot region.
- **Suggestion**: While `projectCreatorOpen`, hide or downgrade the sticky「发起审议」CTA; keep only the form submit as primary for that state.
- **Status**: fixed
- **Response**: Addressed in fix round 2026-06-02 — see `grok-review-b7947346.md`.
### Issue 3 [General] — Severity: bug

- **File**: `src/App.jsx:1492-1498`, `src/components.jsx:928-930`, `src/App.jsx:1261-1269`
- **Description**: After deliberation completes (`showVote`), the main column can show **multiple primaries**: finish block **「导出 HTML 复盘包」** (`btn-primary`), **ContinueDeliberationPanel** (`variant="primary"`), and (when `playbackStarted`) the top-bar primary from `showWorkbenchPrimary`. Info-panel **MemoryReviewPanel** can add more `btn-primary` rows when memory is pending.
- **Suggestion**: Designate one primary for the “closure” viewport (e.g. export HTML **or** continue deliberation, not both). Demote continue to `secondary`, hide top-bar start while `showVote`, and use `secondary` per-row approve in memory review.
- **Status**: fixed
- **Response**: Addressed in fix round 2026-06-02 — see `grok-review-b7947346.md`.
### Issue 4 [General] — Severity: bug

- **File**: `src/App.jsx:1297-1357`, `src/components.jsx:847-896`
- **Description**: When `OnboardingWizard` is visible inside the empty session, its step actions use raw **`btn-primary`** while the empty-session CTA block still renders a **`Button variant="primary"`** below/alongside — up to **two primary funnels** in the same main viewport for new users.
- **Suggestion**: Hide `empty-session-cta` primary while `onboarding.shouldShow`, or route onboarding CTAs through `Button` and share one primary slot.
- **Status**: fixed
- **Response**: Addressed in fix round 2026-06-02 — see `grok-review-b7947346.md`.
### Issue 5 [General] — Severity: bug

- **File**: `styles.css:35`
- **Description**: `.top-nav` uses `background: rgba(var(--bg), 0.8)`. `--bg` is a hex color (`#F6F5F0` / dark equivalent), not comma-separated RGB components, so this declaration is **invalid** and the intended frosted header background may not apply (browser drops the rule).
- **Suggestion**: Use `color-mix(in srgb, var(--bg) 80%, transparent)` or define `--bg-rgb` tokens for `rgba()`.
- **Status**: fixed
- **Response**: Addressed in fix round 2026-06-02 — see `grok-review-b7947346.md`.
### Issue 6 [General] — Severity: bug

- **File**: `src/App.jsx:971-975`, `src/App.jsx:1152`, `src/App.jsx:1346-1353`
- **Description**: `primaryActionLabel` switches to **「查看演示审议」** when `health.aiConfigured === false`, but the sidebar primary remains hard-coded **「发起审议」** while calling the same `handleStartDeliberation` (which invokes demo). Users get **misaligned labels** for the same action across regions.
- **Suggestion**: Reuse `primaryActionLabel` (or a shared `startCtaCopy` helper) for sidebar, empty, and top-bar buttons.
- **Status**: fixed
- **Response**: Addressed in fix round 2026-06-02 — see `grok-review-b7947346.md`.
### Issue 7 [General] — Severity: suggestion

- **File**: `src/components/ScenarioManager.jsx:33-74`
- **Description**: `ScenarioRowMenu` sets `role="menu"` / `menuitem` but lacks **`aria-expanded`**, **`aria-haspopup`**, Escape-to-close, arrow-key roving focus, or focus return to the trigger. Click-outside close is implemented; keyboard/screen-reader menu semantics are incomplete.
- **Suggestion**: Follow WAI-ARIA menu pattern (or use `role="listbox"` / native `<details>` if simplicity is preferred). Wire `aria-expanded={open}` on the trigger and `onKeyDown` for Escape.
- **Status**: fixed
- **Response**: Addressed in fix round 2026-06-02 — see `grok-review-b7947346.md`.
### Issue 8 [General] — Severity: suggestion

- **File**: `src/components/ScenarioManager.jsx:205-211`
- **Description**: Scenario manager dialog has `role="dialog"` and `aria-labelledby` but no **`aria-modal="true"`**, initial focus move, focus trap, or **Escape** handler. Overlay uses `role="presentation"` with click-to-close only.
- **Suggestion**: Add `aria-modal="true"`, focus trap (e.g. focus first focusable on open, restore on close), and `keydown` Escape on `document` while open.
- **Status**: fixed
- **Response**: Addressed in fix round 2026-06-02 — see `grok-review-b7947346.md`.
### Issue 9 [General] — Severity: suggestion

- **File**: `src/App.jsx:1005`, `src/styles/layout/shell.css:45-52`
- **Description**: Mobile menu backdrop is a **non-focusable `<div onClick>`** with no `role="button"`, no keyboard dismissal, and no `aria-hidden` coordination with the sidebar. Screen-reader users may not perceive it as a dismiss control.
- **Suggestion**: Prefer a `<button type="button" className="mobile-menu-backdrop" aria-label="关闭菜单">` or pair backdrop with explicit close control and `inert` on main content while menu is open.
- **Status**: fixed
- **Response**: Addressed in fix round 2026-06-02 — see `grok-review-b7947346.md`.
### Issue 10 [General] — Severity: suggestion

- **File**: `src/styles/components/buttons.css:22-26`, `styles.css:83-104`
- **Description**: Focus styling is **duplicated and conflicting**: new buttons use `box-shadow` + `--focus-ring` in `buttons.css`, while legacy global rules apply **gold `--moderator` outline** to all `button:focus-visible`. Users may see double rings or inconsistent focus color (navy vs gold).
- **Suggestion**: Consolidate focus into `buttons.css` only; scope legacy outline rules to non-`.btn` elements or remove the global block after migration.
- **Status**: fixed
- **Response**: Addressed in fix round 2026-06-02 — see `grok-review-b7947346.md`.
### Issue 11 [General] — Severity: suggestion

- **File**: `src/styles/layout/shell.css:520`, `styles.css:1016-1020`
- **Description**: `.nav-btn.active` and `.copy-mode-switch .ghost-btn.active` apply **primary-filled styling** on `ghost`/`subtle` controls. This reads as extra primary buttons beside real `btn-primary` CTAs and undermines the five-level hierarchy.
- **Suggestion**: Use teal border / surface tint for selection (match `.ui-chip--active`) instead of full primary fill for nav/copy mode.
- **Status**: fixed
- **Response**: Addressed in fix round 2026-06-02 — see `grok-review-b7947346.md`.
### Issue 12 [General] — Severity: suggestion

- **File**: `src/App.jsx` (whole file, ~1811 lines post-refactor), `src/App.test.jsx:36-55`
- **Description**: `App.jsx` remains a **god component** (routing, sidebar, transcript, history, exports, onboarding gates). Tests mostly **static string** checks for class names, not behavior of the new UI kit or primary hierarchy.
- **Suggestion**: Extract `WorkbenchSidebar`, `WorkbenchTopBar`, `EmptySession`, `FinishActions` into `src/workbench/` (or similar). Add RTL tests: idle → one visible `.btn-primary` in viewport; `playbackStarted` → top-bar primary, no sidebar primary.
- **Status**: fixed
- **Response**: Addressed in fix round 2026-06-02 — see `grok-review-b7947346.md`.
### Issue 13 [General] — Severity: suggestion

- **File**: `src/App.jsx` (grep `btn btn-`), `src/components.jsx:172-898`, `src/LandingSite.jsx:34`
- **Description**: **Partial migration**: high-traffic paths use `src/ui`, but many controls still use raw `<button className="btn btn-*">` (project CRUD, onboarding, memory review, exports, finish actions, starter cards). Behavior diverges (`aria-busy` / loading spinner only on `Button`; `export-success` tied to raw classes).
- **Suggestion**: Track migration in a checklist; wrap remaining hotspots or add ESLint rule `no-raw-btn-class` outside `src/ui`.
- **Status**: fixed
- **Response**: Addressed in fix round 2026-06-02 — see `grok-review-b7947346.md`.
### Issue 14 [General] — Severity: suggestion

- **File**: `src/LandingSite.jsx:34`, `src/LandingSite.jsx:103-112`
- **Description**: Landing mixes **`Button`** (nav CTAs) with raw **`<a className="btn btn-ghost">`** (GitHub) and **`<button className="landing-explore-card">`** (explore grid) without `Button`/`Chip`. Styling works via `.landing-shell .btn`, but focus/loading/disabled behavior is inconsistent with the workbench kit.
- **Suggestion**: Use `Button` + `as="a"` pattern (or a small `LinkButton`) for external links; map explore cards to `Button variant="ghost"` with layout class.
- **Status**: fixed
- **Response**: Addressed in fix round 2026-06-02 — see `grok-review-b7947346.md`.
### Issue 15 [General] — Severity: suggestion

- **File**: `src/components/TaskPanel.jsx:56-59`
- **Description**: Task card selector uses raw **`btn btn-ghost`** instead of `Button`, while adjacent actions use `Button` — inconsistent component usage in the same panel refactored in 1.3.2.
- **Suggestion**: Replace `task-card-select` with `Button variant="ghost"` and move layout overrides to CSS.
- **Status**: fixed
- **Response**: Addressed in fix round 2026-06-02 — see `grok-review-b7947346.md`.
### Issue 16 [General] — Severity: nit

- **File**: `src/styles/components/buttons.css:1`, `src/styles/tokens.css:1`, `src/styles/layout/shell.css:1`, `styles.css:1`
- **Description**: UTF-8 **BOM** (`﻿`) at the start of multiple CSS files. Usually harmless but can surprise diff tools or concatenation pipelines.
- **Suggestion**: Save as UTF-8 without BOM.
- **Status**: fixed
- **Response**: Addressed in fix round 2026-06-02 — see `grok-review-b7947346.md`.
### Issue 17 [General] — Severity: nit

- **File**: `src/ui/Button.jsx:34`
- **Description**: Unknown `variant` values silently map to **`ghost`** (`VARIANT_CLASS[variant] || VARIANT_CLASS.ghost`). Typos fail quietly at runtime.
- **Suggestion**: `if (import.meta.env.DEV && !VARIANT_CLASS[variant]) console.warn(...)` or TypeScript / PropTypes.
- **Status**: fixed
- **Response**: Addressed in fix round 2026-06-02 — see `grok-review-b7947346.md`.
### Issue 18 [General] — Severity: nit

- **File**: `styles.css:2-5`
- **Description**: Four **`@import url(...)`** layers block parallel CSS fetch in browsers that treat `@import` serially; acceptable for now but not ideal for LCP on landing.
- **Suggestion**: Eventually import split CSS from `main.jsx` (Vite) or use a single bundled tokens+buttons chunk for production.
- **Status**: fixed
- **Response**: Addressed in fix round 2026-06-02 — see `grok-review-b7947346.md`.
---

## Positive notes

- **`src/ui/Button.jsx`**: Clean five-variant mapping, `aria-busy` when loading, reduced-motion handled in `buttons.css`.
- **`Chip`**: Correct `aria-pressed` for selectable scenario/topic chips; active state styled via `.ui-chip--active`.
- **`IconButton`**: Enforces `aria-label`; used for top-bar menu/focus/home with decorative SVGs marked `aria-hidden`.
- **CSS split**: `tokens.css` → `buttons.css` → `shell.css` → `landing.css` matches documented layering; landing `--lp-*` derives from workspace palette.
- **`body[data-app-view]`**: Set via `document.body.dataset.appView` in `App.jsx:215-220` (maps to `data-app-view`), coordinating scroll lock for workspace vs landing in `shell.css`.
- **Playback gating**: Sidebar primary hidden when `playbackStarted`; top-bar primary shown only then — correct region handoff when not in conflicting finish/onboarding states.

---

## Recommended follow-up (priority)

1. Fix **invalid `.top-nav` background** (Issue 5) — quick CSS win.  
2. Resolve **idle dual-primary** + **project form dual-primary** (Issues 1–2) — aligns product with `docs/ui-principles.md`.  
3. Tighten **finish / onboarding / memory** primary stacking (Issues 3–4).  
4. Unify **CTA copy** (Issue 6) and **menu/dialog a11y** (Issues 7–9).  
5. Add **regression tests** for primary count per view state (Issue 12).

---

*Review generated against workspace at commit `4cb4c11`; tests run locally on 2026-06-02.*