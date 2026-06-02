> **Fix round 2026-06-02:** Priority fixes shipped. Tracker: `grok-review-b7947346.md`.

# Grok Review — General-3 (UI 1.3.2 Refactor)

| Field | Value |
|-------|-------|
| **Review ID** | `b7947346-general-3` |
| **Scope** | ScenarioManager overflow menu, TaskPanel, ContinueDeliberationPanel `Button` props, `index.html` font loading, `styles.css` `@import` chain |
| **Version** | 1.3.2 (`package.json` / `CHANGELOG.md`) |
| **Date** | 2026-06-02 |
| **Reviewer** | Grok (third general pass) |
| **Verdict** | **Shippable with hygiene fixes** — targeted areas are largely wired correctly; remaining gaps are a11y/menu clipping, completion-zone primary stacking, dead props, font/mono loading, and CSS split debt. |

---

## Executive summary

The 1.3.2 refactor goals are **mostly met** in the five focus areas:

- **ScenarioManager** — row actions correctly collapsed into `ScenarioRowMenu` with `IconButton` + overflow panel; footer/modal actions use `src/ui/Button`.
- **TaskPanel** — create/timeline/delete paths use unified `Button`; hierarchy (`secondary` create, `ghost` row actions) aligns with `docs/ui-principles.md`.
- **ContinueDeliberationPanel** — uses `Button` with valid props (`type`, `variant`, `onClick`, `disabled`, `title`); placement after export block matches tests in `components.outcome.test.jsx`.
- **Fonts** — `index.html` loads Source Sans 3 + LXGW WenKai with `preconnect` and `display=swap`; tokens reference matching family names.
- **CSS chain** — `main.jsx` → `styles.css` → `tokens.css` → `buttons.css` → `shell.css` → `landing.css` is ordered correctly.

Open issues below are **non-blocking** for a tagged 1.3.2 release but should be tracked before calling the refactor “complete.”

---

## Focus-area notes

### 1. ScenarioManager overflow menu (`ScenarioRowMenu`)

**What works**

- Per-row `⋯` trigger with `stopPropagation` avoids accidental scenario select.
- Outside-click listener closes menu when open.
- Menu items use `Button variant="ghost" size="sm"` with `role="menuitem"`.
- Styles live in `styles.css` (`.scenario-row-menu*`) with adequate z-index inside row.

**Gaps**

- Menu pattern is visual-only: no `aria-haspopup` / `aria-expanded` on trigger, no `Escape` handler, no roving tabindex / arrow-key navigation.
- **Clipping risk:** `.modal-panel { overflow: hidden }` (`landing.css`) + `.scenario-manager-body { overflow-y: auto }` can clip the absolutely positioned `.scenario-row-menu-panel` for rows near the bottom of the scroll list.
- Builtin rows use menu label **「删除」** but `handleDelete` **hides** builtins (`hideBuiltinScenario`) — misleading copy; should be **「隐藏」** or use `variant="danger"` only for irreversible user scenarios.
- Delete/hide has **no confirmation** (unlike history-item confirm pattern elsewhere).
- Legacy `.scenario-row-actions { display: none; }` in `styles.css` — dead CSS after overflow migration.

### 2. TaskPanel

**What works**

- Section shell, create form, timeline, and delete wired to `Button`.
- `variant="secondary" size="sm"` on create matches “secondary = visible but not primary” rule for info panel.
- Task card active state and timeline buttons styled via `landing.css` + `styles.css` hover rules.

**Gaps**

- **`onSelectScenario` is passed from `App.jsx` but never used** in `TaskPanel.jsx` — dead API surface; tasks bind `scenarioId` only at create time with no in-panel edit.
- **`task-card-select` still uses raw `btn btn-ghost`** instead of `<Button>` — inconsistent with 1.3.2 “high-traffic → `src/ui`” goal.
- Task **delete** is one-click `ghost` (not `danger`, no confirm) — undermines destructive-action guidance in `docs/ui-principles.md`.
- Create form uses `className="input"` (defined in `tokens.css`) while timeline uses component buttons — acceptable but mixed input styling vs `.task-create-form input` overrides in `landing.css`.

### 3. ContinueDeliberationPanel — `Button` props

**What works** (`src/components.jsx` L906–932)

```jsx
<Button
  type="button"
  variant="primary"
  onClick={onSubmit}
  disabled={disabled}
  title={disabledHint}
>
  基于此发起继续审议
</Button>
```

- Props are valid for `Button.jsx` (`type`, `variant`, `disabled`, spread `...rest` for `onClick`/`title`).
- `disabledHint` flows to `title` when demo/generating — helpful when `pointer-events: none` on disabled buttons blocks hover in some browsers (title still weak for screen readers).
- Panel uses `aria-label` on `<section>`; textarea has `disabled` parity.

**Gaps**

- **Second `primary` in completion viewport:** `#finish-actions` still has raw `btn btn-primary` export CTA **above** this panel — violates “one primary per viewport” in `docs/ui-principles.md` / `impl-summary-b7947346.md`. Recommend `variant="secondary"` here or demote export HTML to `secondary` and keep continue as sole primary in “后续动作”.
- No **`aria-describedby`** linking hint text to button/textarea when disabled.
- **Enter in textarea does not submit** — only button `onClick`; consider `<form onSubmit>` or `onKeyDown` for keyboard users.
- Export block still uses **raw `btn btn-*`** (not `Button`) — out of scope but adjacent to this panel in reading order.

### 4. `index.html` font loading

**What works**

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600&display=swap" rel="stylesheet" />
<link href="https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/style.css" rel="stylesheet" />
```

- Matches `--sans` / `--serif` in `tokens.css`.
- `display=swap` on Google bundle reduces FOIT.

**Gaps**

- **`--mono: 'JetBrains Mono', …`** is used in workspace + landing (`setup-guide-snippet`, `usage-detail`, etc.) but **no `<link>` loads JetBrains Mono** — silent fallback to system monospace.
- UI/CSS uses **`font-weight: 800`** widely (`shell.css`, `styles.css`) while Source Sans 3 request is **400/500/600 only** — browser synthetic bold may look uneven vs designed weights.
- **External CDN dependency** for core Chinese serif (jsDelivr) + Google Fonts — offline/air-gapped installs need documented fallback (system serif already in stack).
- No `rel="preload"` for critical Wenkai CSS on landing-first paint (optional perf win).

### 5. `styles.css` `@import` chain

**What works**

```css
@import url("./src/styles/tokens.css");
@import url("./src/styles/components/buttons.css");
@import url("./src/styles/layout/shell.css");
@import url("./src/styles/landing.css");
```

- Entry: `src/main.jsx` imports `../styles.css` — single bundle path for Vite.
- Order: tokens → buttons → shell → landing respects cascade (landing can use tokens + `.btn-*`).
- `docs/ui-principles.md` documents the same tree.

**Gaps**

- **CSS `@import` is render-blocking** (sequential fetch). Acceptable for current size; consider Vite-side `@import` in JS or merged entry if perf becomes an issue.
- **Split brain:** scenario row layout in `landing.css`, overflow menu in monolithic `styles.css` tail — harder to maintain than co-locating under `src/styles/components/`.
- **`styles.css` remains ~1100+ lines** of workspace rules — partial extraction only; 1.3.2 split is incremental, not finished.
- **`.scenario-row-actions { display: none; }`** — orphan from pre-overflow layout.

---

## Structured issues

| ID | Severity | Area | Status | Summary |
|----|----------|------|--------|---------|
| G3-01 | **High** | ScenarioManager menu | **open** | Overflow panel may clip inside modal (`overflow: hidden` / scroll body). |
| G3-02 | **Medium** | UI principles | **open** | Completion zone has two primaries: export `btn-primary` + continue `Button variant="primary"`. |
| G3-03 | **Medium** | ScenarioManager a11y | **open** | Menu missing `aria-expanded`, Escape, focus trap, arrow-key pattern. |
| G3-04 | **Medium** | ScenarioManager copy | **open** | Builtin hide action labeled「删除」; should be「隐藏」or danger only for user delete. |
| G3-05 | **Medium** | TaskPanel API | **open** | `onSelectScenario` prop unused — remove or wire scenario picker on task card. |
| G3-06 | **Low** | TaskPanel consistency | **open** | `task-card-select` still raw `btn btn-ghost`, not `Button`. |
| G3-07 | **Low** | TaskPanel / ScenarioManager | **open** | Destructive actions lack confirm + `danger` variant per ui-principles. |
| G3-08 | **Low** | ContinueDeliberationPanel | **open** | No `aria-describedby` for `disabledHint`; Enter does not submit. |
| G3-09 | **Low** | Fonts | **open** | JetBrains Mono referenced in tokens but not loaded in `index.html`. |
| G3-10 | **Low** | Fonts | **open** | Source Sans 3 weights 400–600 vs pervasive `font-weight: 800` in CSS. |
| G3-11 | **Low** | Fonts / ops | **open** | Core typography depends on Google + jsDelivr CDNs. |
| G3-12 | **Low** | CSS architecture | **open** | Scenario menu styles split across `styles.css` + `landing.css`; dead `.scenario-row-actions`. |
| G3-13 | **Info** | CSS perf | **open** | Sequential `@import` chain — document or migrate to Vite-native imports later. |

---

## Issue details

### G3-01 — Menu clipping in scenario modal

- **Status:** open  
- **Evidence:** `landing.css` `.modal-panel { overflow: hidden }`; `.scenario-row-menu-panel { position: absolute; top: calc(100% + 4px) }` in `styles.css`.  
- **Recommendation:** Use fixed positioning portal for menu, or set `overflow: visible` on list column, or flip panel above trigger when near bottom (`IntersectionObserver` / popover utility).

### G3-02 — Dual primary in completion block

- **Status:** open  
- **Evidence:** `App.jsx` L1493–1499 (`btn btn-primary` export) + L1572–1580 (`ContinueDeliberationPanel` → `variant="primary"`).  
- **Recommendation:** Demote export HTML to `secondary` or move continue CTA to `secondary` if export remains the main “takeaway” action; align with one-primary rule per scroll region.

### G3-03 — Incomplete menu a11y

- **Status:** open  
- **Evidence:** `ScenarioManager.jsx` L48–63 trigger; L65–72 panel — no ARIA menu semantics beyond `role="menu"`.  
- **Recommendation:** `aria-haspopup="menu"`, `aria-expanded={open}`, `onKeyDown` (Escape/arrows), focus first item on open.

### G3-04 — Misleading delete label for builtins

- **Status:** open  
- **Evidence:** Menu always renders「删除」; `handleDelete` branches to `hideBuiltinScenario` for `scenario.builtin`.  
- **Recommendation:** Conditional label「隐藏」/「删除」; optional `variant="danger"` for permanent user scenario removal only.

### G3-05 — Unused `onSelectScenario` in TaskPanel

- **Status:** open  
- **Evidence:** `TaskPanel.jsx` props list L4–13; `App.jsx` L1624 passes `onSelectScenario={handleSelectScenario}` — no reference in component body.  
- **Recommendation:** Remove prop from API or add task-level scenario `<select>` calling `onSelectScenario` + `onUpdateTask`.

### G3-06 — Task card select not on design system

- **Status:** open  
- **Evidence:** `TaskPanel.jsx` L56–58 `className="task-card-select btn btn-ghost"`.  
- **Recommendation:** Replace with `<Button variant="ghost" className="task-card-select">` for consistent focus/disabled/loading behavior.

### G3-07 — Destructive actions without danger/confirm

- **Status:** open  
- **Evidence:** TaskPanel delete `variant="ghost"`; ScenarioManager menu delete one-click.  
- **Recommendation:** Mirror `history-item--confirm` pattern; use `variant="danger"` for irreversible user scenario delete.

### G3-08 — Continue panel a11y / keyboard

- **Status:** open  
- **Evidence:** `disabledHint` only on `title`; textarea L920–927 no submit on Enter.  
- **Recommendation:** `id` on hint span + `aria-describedby`; optional `form` wrapper with `onSubmit` prevention.

### G3-09 — Mono font not loaded

- **Status:** open  
- **Evidence:** `tokens.css` L51; `index.html` has no JetBrains link.  
- **Recommendation:** Add jsDelivr/Google font link for JetBrains Mono subset, or drop from `--mono` stack to `'SF Mono', monospace` only.

### G3-10 — Font weight mismatch

- **Status:** open  
- **Evidence:** Google URL `wght@400;500;600`; many `font-weight: 800` rules in `shell.css` / `styles.css`.  
- **Recommendation:** Add `700;800` to Google request or reduce CSS weights to loaded range.

### G3-11 — CDN typography dependency

- **Status:** open  
- **Evidence:** `index.html` L8–11 external links.  
- **Recommendation:** Document offline behavior; optional `npm` font packages + self-host in `public/fonts/` for enterprise installs.

### G3-12 — CSS co-location / dead rules

- **Status:** open  
- **Evidence:** `styles.css` L1096–1113 vs `landing.css` L904–917; `.scenario-row-actions { display: none; }` unused in JSX.  
- **Recommendation:** Move scenario-menu block to `src/styles/components/scenario-manager.css` and import from master; delete dead selector.

### G3-13 — `@import` blocking chain

- **Status:** open  
- **Evidence:** `styles.css` L2–5.  
- **Recommendation:** Track as tech debt; Vite can `@import` in `main.jsx` as separate CSS modules if waterfall shows in Lighthouse.

---

## Verification performed

| Check | Result |
|-------|--------|
| Read `ScenarioManager.jsx`, `TaskPanel.jsx`, `ContinueDeliberationPanel` in `components.jsx` | Done |
| Read `Button.jsx`, `IconButton.jsx`, `index.html`, `styles.css`, `tokens.css`, relevant `landing.css` | Done |
| Trace `App.jsx` TaskPanel + completion block ordering | Matches `components.outcome.test.jsx` expectations |
| Grep `.scenario-row-actions`, `.input`, `--mono` | Confirmed dead CSS + mono gap |

**Not re-run this pass:** `npm test` / `npm run build` (prior impl summary reports green).

---

## Suggested fix order (for implementer)

1. G3-01 (menu clipping) + G3-03 (a11y) — user-visible in scenario manager.  
2. G3-02 (dual primary) — quick prop/class change in completion block.  
3. G3-04, G3-07 (copy + destructive UX).  
4. G3-05, G3-06 (TaskPanel API + Button migration).  
5. G3-09–G3-12 (fonts + CSS hygiene).

---

## Sign-off

| Criterion | Assessment |
|-----------|------------|
| Overflow menu implemented | Yes |
| TaskPanel on design system (partial) | Create/timeline yes; card select no |
| ContinueDeliberation `Button` props | Correct |
| Font loading aligned with tokens | Partial (mono gap, weight gap) |
| `@import` chain valid | Yes |

**Overall:** **Approve 1.3.2 tag with open hygiene list above** — no P0 functional regression found in scoped review.