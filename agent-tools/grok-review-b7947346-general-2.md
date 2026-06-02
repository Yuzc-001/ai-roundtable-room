> **Fix round 2026-06-02:** Priority fixes shipped. Tracker: `grok-review-b7947346.md`.

# General Code Review — UI Refactor 1.3.2 (General-2)

| Field | Value |
|-------|-------|
| **Review ID** | `b7947346-general-2` |
| **Reviewer** | Grok (second independent general pass) |
| **Scope** | Visual/CSS regressions, dark theme, mobile sidebar, landing↔workbench token drift, duplicate CTAs |
| **Implementation ref** | `agent-tools/impl-summary-b7947346.md` |
| **Related reviews** | `grok-review-b7947346-general.md` (breadth), `grok-review-b7947346-general-3.md` (components/CSS chain) |
| **Date** | 2026-06-02 |
| **Verdict** | **Shippable with visual/UX fixes** — design system foundation is solid; focus areas expose real cross-surface regressions, especially **landing + saved dark theme** and **mobile sidebar → hidden info panel**. |

---

## Executive summary

| Area | Assessment |
|------|------------|
| **Visual/CSS regressions** | Several invalid or legacy overrides fight the new `.btn-*` matrix (`.top-nav` `rgba()`, `.project-form-actions`, dual focus rings). |
| **Dark theme** | Workbench tokens are strong; **landing chamber is not isolated** from `html[data-theme="dark"]` for surfaces/lines; semantic tags use **light-only hex** in `tokens.css`. |
| **Mobile sidebar** | Drawer/backdrop/ESC/scroll-lock are present; **「审议任务」/「会议记录」nav scroll targets live in `display:none` info panel** — functional regression on ≤768px. |
| **Landing↔workbench tokens** | `.landing-shell` pins `--primary`/`--accent`/`--teal` but **`--lp-*` duplicates `--bg`/`--ink` literals**; non-pinned globals (`--surface`, `--line-strong`, `--moderator`) still leak. |
| **Duplicate CTAs** | Documented “per region” model is implemented in code paths, but **home landing** and **idle desktop workbench** still show **two simultaneous primaries**; copy diverges between sidebar and hero. |

### Verification

| Check | Result |
|-------|--------|
| `npm test` | 26 files, **147 passed** |
| Repo scan | `App.jsx`, `LandingSite.jsx`, `tokens.css`, `landing.css`, `shell.css`, `buttons.css`, `styles.css` |

---

## Focus-area analysis

### 1. Visual / CSS regressions

**Invalid frosted top bar** — `styles.css:35` uses `background: rgba(var(--bg), 0.8)` while `--bg` is hex (`#F6F5F0` / `#0C0E0C`). Browsers drop the rule; the intended translucent header may be missing.

**Legacy button overrides vs `src/ui`** — `shell.css:471-475` `.project-form-actions button` forces gray/teal (`--ink-4`, `--academy`) on elements that already carry `btn btn-ghost` / `btn btn-primary`, **overriding** navy primary and ghost borders from `buttons.css`.

**Dual focus systems** — `buttons.css` uses `--focus-ring` + `box-shadow`; `styles.css:83-104` applies gold `--moderator` outline on all `button:focus-visible` including `.btn`. Users can see **stacked or conflicting rings** (navy + gold).

**Selection styled as second primary** — `.nav-btn.active` (`shell.css:520`) fills with `--primary` + light-theme shadow `rgba(30, 58, 95, 0.25)` regardless of `data-theme`.

**CSS file placement** — Workbench modal/scenario/task rules live at the tail of `landing.css` (~L839+) while overflow menu rules sit in `styles.css`. Refactor split is **partial**; visual bugs are harder to trace.

### 2. Dark theme

**Default theme is dark** (`App.jsx:91` `useLocalStorage(..., 'dark')`); `document.documentElement` always carries `data-theme` even on landing (`App.jsx:213`).

**Landing “light chamber” is incomplete** — `.landing-shell` resets `--primary`/`--accent`/`--teal` to light values (`landing.css:29-31`) but **does not reset** `--surface`, `--surface-2`, `--line`, `--line-strong`, `--ink`, `--moderator`, `--academy`. Components using global tokens (`.btn-secondary`, `Logo` SVG strokes, setup snippets using `--surface-2`) inherit **dark workspace surfaces on a light `--lp-bg` page**.

**Semantic tags not theme-aware** — `tokens.css:198` `.tag-act-claim` hardcodes `color: #8A6A3A` (light-context brown). On `[data-theme="dark"]` surfaces, contrast and hue alignment with `--accent` / `--warning` drift.

**Minimal dark-only CSS** — Aside from token block and `[data-theme="dark"] .app::after { opacity: 0.01 }`, there are **no dark adjustments** for nav active shadow, starter-card hover shadows, or landing explore hover `#fff` fills.

### 3. Mobile sidebar

**What works**

- Off-canvas sidebar (`transform: translateX(-100%)`), opens at 280px when `data-mobile-menu="true"` (`shell.css:57-66`).
- Backdrop click closes menu; `body` scroll locked while open (`App.jsx:345-353`).
- ESC closes menu (after persona drawer) (`App.jsx:320-331`).
- 44px min-height on sidebar controls (`shell.css:88-98`).
- Hamburger via `IconButton` + `mobile-only` (`App.jsx:1179-1196`).

**Regressions**

- **`info-panel { display: none }` on mobile** (`shell.css:68`) while sidebar buttons call `scrollToWorkbenchSection('workbench-tasks'|'workbench-history')` (`App.jsx:1119-1138`) targeting nodes inside that panel (`App.jsx:1619-1653`). Scroll may run, but **content is not visible** — broken IA on phones.
- Backdrop is a non-focusable `<div onClick>` (`App.jsx:1005`) — no keyboard dismiss path except ESC (see also General-1 Issue 9).
- **Idle mobile**: user must open menu for sidebar「发起审议」*or* use empty-session primary in main column — **two primaries** remain if menu is opened (duplicate CTA focus).

### 4. Landing ↔ workbench token drift

| Token | Workbench (`tokens.css` light) | Landing (`landing.css`) | Drift risk |
|-------|-------------------------------|-------------------------|------------|
| Page bg | `--bg: #F6F5F0` | `--lp-bg: #F6F5F0` (literal duplicate) | Drift on palette change |
| Primary | theme-dependent on `:root` | pinned `#1E3A5F` on `.landing-shell` | **Mitigated** for primary buttons |
| Surfaces | theme-dependent | **not pinned** | **`.btn-secondary` uses dark `--surface` on light landing** when theme=dark |
| Lines / ink | theme-dependent | `--lp-line`, `--lp-ink` local | Logo / ghost borders use **global** `--line-strong` |
| Serif/sans | `--serif`, `--sans` | `--lp-serif: var(--serif)` | OK |

**Hero secondary CTA** — `LandingHome` uses `Button variant="secondary"` (`LandingSite.jsx:93`); with no `.landing-shell .btn-secondary` override, it pulls **`var(--surface)` / `var(--primary)` from `html[data-theme]`**, not `--lp-*`.

**Explore cards** — Mostly `--lp-*`; hover sets `background: #fff` (`landing.css:739`) — fine on light chamber, inconsistent if chamber palette shifts.

**Theme persistence** — User sets dark in workbench → returns to landing → light parchment + dark controls. No `data-theme="light"` scope on `.landing-shell`.

### 5. Duplicate CTAs

| Viewport | Primary controls visible together | Labels |
|----------|-----------------------------------|--------|
| Landing home | Nav + hero | both `copy.primary` (e.g. 进入议事厅) |
| Workbench idle (desktop) | Sidebar foot + empty session | **发起审议** vs **启动结构化审议** / demo label |
| Workbench idle + project form | Sidebar **创建** + **发起审议** | two primaries in sidebar |
| Workbench idle + onboarding | Wizard step `btn-primary` + empty-session `Button primary` | two funnels |
| Finish / vote | Export HTML `btn-primary` + continue `Button primary` + optional top-bar | three possible |

Impl summary and `ui-principles.md` justify **per-region** primaries; checklist wording (“该屏是否只有一个 primary?”) and user perception on **one physical viewport** still conflict. General-2 treats **simultaneous visible primaries** as issues for product polish.

**Copy drift** — `primaryActionLabel` (`App.jsx:971-975`) not applied to sidebar「发起审议」(`App.jsx:1152`) when API unconfigured (demo path).

---

## Structured issues

> **All issues: Status: fixed** (fix round 2026-06-02)

### G2-01 — Mobile: sidebar “任务 / 历史” scroll into hidden info panel

| Field | Value |
|-------|-------|
| **Severity** | **High** (functional regression) |
| **Status** | fixed |
| **Files** | `src/styles/layout/shell.css:68`, `src/App.jsx:984-987`, `1119-1138`, `1604-1653` |
| **Finding** | At `max-width: 768px`, `.info-panel { display: none }`, but sidebar `Button` handlers scroll to `#workbench-tasks` / `#workbench-history` inside that panel. Mobile users cannot see or interact with task/history UI after tapping sidebar entries. |
| **Recommendation** | On mobile: bottom sheet / full-screen drawer for tasks+history, move sections into main column, or temporarily show info panel as overlay when navigating from sidebar. Gate scroll helpers behind a `isMobile` path. |

---

### G2-02 — Landing + dark saved theme: `btn-secondary` uses workspace dark surfaces

| Field | Value |
|-------|-------|
| **Severity** | **High** (visual regression) |
| **Status** | fixed |
| **Files** | `src/LandingSite.jsx:93`, `src/styles/components/buttons.css:42-50`, `src/styles/landing.css:27-46`, `src/App.jsx:91,213` |
| **Finding** | Default/localStorage theme is **dark**. Landing hero secondary (“先看演示” / demo CTA) uses `.btn-secondary { background: var(--surface) }` from global tokens → **dark gray button on light `--lp-bg`**, breaking “fixed light chamber” intent. |
| **Recommendation** | Under `.landing-shell`, add full chamber scope: `--surface`, `--surface-2`, `--line`, `--line-strong`, `--ink*`, `--focus-ring`, and `.btn-secondary` overrides using `--lp-*`. Or force `data-theme="light"` on `document.documentElement` while `body[data-app-view="landing"]`. |

---

### G2-03 — Landing Logo / chrome leak global dark tokens

| Field | Value |
|-------|-------|
| **Severity** | **Medium** |
| **Status** | fixed |
| **Files** | `src/components.jsx:6-17`, `src/styles/tokens.css:96-98`, `src/styles/landing.css:27-46` |
| **Finding** | `Logo` uses `var(--line-strong)` and `var(--moderator)` / `var(--academy)` from `html[data-theme="dark"]`. On light landing, the dashed circle stroke (`--line-strong` → white 13% alpha) is **nearly invisible** on `#F6F5F0`. |
| **Recommendation** | Pin `--line-strong`, `--moderator`, `--academy` on `.landing-shell` to light-chamber values, or pass `className` / CSS variables into `Logo` for landing context. |

---

### G2-04 — `--lp-*` literals duplicate workspace tokens (drift on palette edits)

| Field | Value |
|-------|-------|
| **Severity** | **Medium** (maintainability / drift) |
| **Status** | fixed |
| **Files** | `src/styles/landing.css:32-35`, `src/styles/tokens.css:10-18` |
| **Finding** | `--lp-bg` / `--lp-ink` / `--lp-muted` repeat `#F6F5F0`, `#1A211D`, `#5F6762` instead of `var(--bg)`, `var(--ink)`, `var(--ink-3)` under a scoped light context. Impl summary claims “derived from workspace palette”; only accent chain uses `var(--primary)`. |
| **Recommendation** | Define once: e.g. `.landing-shell { --lp-bg: var(--bg); ... }` with parent `data-theme="light"` lock, or shared `:root` light snapshot block imported by both. |

---

### G2-05 — Invalid `.top-nav` translucent background

| Field | Value |
|-------|-------|
| **Severity** | **Medium** (CSS bug) |
| **Status** | fixed |
| **Files** | `styles.css:35-36` |
| **Finding** | `rgba(var(--bg), 0.8)` is invalid for hex CSS variables; frosted header may fall back to transparent. |
| **Recommendation** | `background: color-mix(in srgb, var(--bg) 80%, transparent);` (matches landing nav pattern). |

---

### G2-06 — `.project-form-actions` overrides unified button variants

| Field | Value |
|-------|-------|
| **Severity** | **Medium** (visual regression) |
| **Status** | fixed |
| **Files** | `src/styles/layout/shell.css:471-475`, `src/App.jsx:1038-1041` |
| **Finding** | Rules target all `button` children with gray/teal backgrounds, defeating `btn-primary` / `btn-ghost` colors and breaking five-level hierarchy in sidebar project creator. |
| **Recommendation** | Remove generic `button` rules; rely on `Button` variants or scope overrides to `.project-form-actions .btn` only if layout spacing is needed. |

---

### G2-07 — Idle workbench: two visible primary CTAs (desktop)

| Field | Value |
|-------|-------|
| **Severity** | **Medium** (UX / principles) |
| **Status** | fixed |
| **Files** | `src/App.jsx:1142-1153`, `1345-1354`, `docs/ui-principles.md` |
| **Finding** | When `!playbackStarted`, sidebar「发起审议」and empty-session「启动结构化审议」are both `variant="primary"` and visible on wide layouts — two navy CTAs, different labels, same handler. |
| **Recommendation** | Single owner: e.g. primary only in empty-session; sidebar uses `secondary` or collapses to icon link. Share `primaryActionLabel` for copy. (Aligns with General-1 Issue 1.) |

---

### G2-08 — Landing home: nav + hero dual primary

| Field | Value |
|-------|-------|
| **Severity** | **Medium** |
| **Status** | fixed |
| **Files** | `src/LandingSite.jsx:35`, `92` |
| **Finding** | Sticky nav and hero both render `Button variant="primary"` with the same enter action without scroll separation — two primaries in one viewport. |
| **Recommendation** | Nav: `secondary` or text link; hero keeps sole primary. Document landing regions in `ui-principles.md`. (Aligns with plan review ISSUE-001.) |

---

### G2-09 — Sidebar vs empty-session primary label mismatch (demo path)

| Field | Value |
|-------|-------|
| **Severity** | **Low** |
| **Status** | fixed |
| **Files** | `src/App.jsx:971-975`, `1152`, `1346-1353` |
| **Finding** | When `health.aiConfigured === false`, empty session shows「查看演示审议」via `primaryActionLabel`; sidebar stays「发起审议」while both call `handleStartDeliberation` → demo. |
| **Recommendation** | Use `primaryActionLabel` (or shared helper) on sidebar foot CTA. |

---

### G2-10 — Dark theme: semantic tag colors use light-only hex

| Field | Value |
|-------|-------|
| **Severity** | **Low** |
| **Status** | fixed |
| **Files** | `src/styles/tokens.css:198-207` |
| **Finding** | `.tag-act-claim { color: #8A6A3A }` and purple memory tag hex do not adapt under `[data-theme="dark"]`; contrast vs `--surface` may fail WCAG for small 11px tags. |
| **Recommendation** | Use `color-mix` with `var(--accent)` / `var(--warning)` or add `[data-theme="dark"]` tag overrides. |

---

### G2-11 — Conflicting focus-visible styling (gold vs navy)

| Field | Value |
|-------|-------|
| **Severity** | **Low** |
| **Status** | fixed |
| **Files** | `styles.css:83-104`, `src/styles/components/buttons.css:22-26`, `styles.css:60` |
| **Finding** | Global gold `--moderator` outline on all buttons conflicts with `.btn:focus-visible` focus-ring system; `.icon-btn-lite` also uses moderator outline. |
| **Recommendation** | Limit legacy block to non-`.btn` elements; standardize on `--focus-ring`. |

---

### G2-12 — Nav active state reads as extra primary button

| Field | Value |
|-------|-------|
| **Severity** | **Low** |
| **Status** | fixed |
| **Files** | `src/styles/layout/shell.css:520`, `styles.css:1016-1020` |
| **Finding** | `.nav-btn.active` and copy-mode `.ghost-btn.active` use filled `--primary` styling alongside real CTAs. |
| **Recommendation** | Match chip active pattern: teal border + tinted surface (`ui-chip--active`). |

---

### G2-13 — Idle + project creator: dual sidebar primaries

| Field | Value |
|-------|-------|
| **Severity** | **Low** |
| **Status** | fixed |
| **Files** | `src/App.jsx:1034-1041`, `1142-1153` |
| **Finding** | With `projectCreatorOpen`, submit「创建」(`btn-primary`) and sticky「发起审议」both visible. |
| **Recommendation** | Hide or downgrade sticky primary while creator form is open. (General-1 Issue 2.) |

---

### G2-14 — Onboarding + empty-session simultaneous primaries

| Field | Value |
|-------|-------|
| **Severity** | **Low** |
| **Status** | fixed |
| **Files** | `src/App.jsx:1297-1357`, `src/components.jsx:847-896` |
| **Finding** | `OnboardingWizard` raw `btn-primary` steps render above/alongside empty-session `Button variant="primary"`. |
| **Recommendation** | Hide empty-session CTA block while `onboarding.shouldShow`; migrate wizard actions to `Button`. |

---

### G2-15 — Finish zone: export + continue deliberation both primary

| Field | Value |
|-------|-------|
| **Severity** | **Low** |
| **Status** | fixed |
| **Files** | `src/App.jsx:1492-1510`, `src/components.jsx:928-930` |
| **Finding** | `#finish-actions` export HTML uses `btn-primary`; `ContinueDeliberationPanel` uses `Button variant="primary"` in same scroll viewport. |
| **Recommendation** | One primary in “带走审议成果” zone; demote the other to `secondary`. |

---

## Positive notes

- **Landing primary/ghost overrides** (`.landing-shell .btn-primary`, `.btn-ghost`) correctly use `--lp-accent` and light ink — good pattern to extend to secondary/surface tokens.
- **Playback handoff** — Sidebar primary hidden when `playbackStarted`; top-bar primary gated by `showWorkbenchPrimary` — correct region swap when not in finish/onboarding overlap.
- **Mobile drawer mechanics** — Transform, backdrop, body scroll lock, and ESC are implemented; fix for G2-01 is routing/IA, not animation.
- **Reduced motion** — Landing animations and button hover transforms respect `prefers-reduced-motion` in `landing.css` / `buttons.css`.
- **`body[data-app-view]`** — Landing vs workspace scroll behavior is separated (`shell.css:11-21`).

---

## Recommended follow-up (priority)

1. **G2-01** — Mobile task/history navigation (blocks mobile sidebar value).  
2. **G2-02 / G2-03 / G2-04** — Complete landing chamber token isolation (dark-theme + Logo + DRY `--lp-*`).  
3. **G2-05 / G2-06** — Quick CSS fixes (top-nav, project form).  
4. **G2-07 / G2-08** — Duplicate primary policy (workbench idle + landing home).  
5. **G2-09–G2-15** — Copy alignment, tag/dark polish, finish/onboarding stacking.

---

## Cross-review deduplication

| Topic | Also in |
|-------|---------|
| Idle dual-primary, onboarding, finish zone, invalid `rgba`, focus rings, nav active | `grok-review-b7947346-general.md` Issues 1–4, 5, 10–11 |
| Landing dual-primary, danger variant, CSS split | `grok-review-b7947346-plan.md` ISSUE-001+ |
| Scenario menu, continue panel, fonts | `grok-review-b7947346-general-3.md` |

General-2 adds **mobile info-panel IA**, **landing+dark token leakage**, and **token duplication/drift** analysis not fully covered in prior passes.

---

*Review generated against workspace UI 1.3.2; `npm test` 147/147 passed on 2026-06-02.*