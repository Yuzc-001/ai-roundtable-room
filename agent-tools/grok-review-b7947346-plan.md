> **Fix round 2026-06-02:** Priority fixes shipped. Tracker: `grok-review-b7947346.md`.

# Plan Alignment Review — UI Refactor 1.3.2

**Reviewer:** Tech lead (plan check)  
**Plan scope:** Full UI refactor, 议事厅档案感, anti-AI-slop; `docs/ui-principles.md`; `src/ui` Button/Chip/IconButton; CSS split + landing/workbench token unify; App sidebar/empty one-primary-per-region; ScenarioManager overflow menu; v1.3.2; all tests pass  
**Implementation ref:** `agent-tools/impl-summary-b7947346.md`  
**Verified at:** 2026-06-02 (repo scan + `npm test`, `npm run build`)

---

## Executive summary

| Verdict | Detail |
|---------|--------|
| **Ship-ready for stated 1.3.2 scope** | Core deliverables exist; tests and build green |
| **Plan alignment** | **~85%** — high-traffic paths match; full-repo button/CSS migration and strict anti-slop are incomplete |
| **Blocking defects** | None found against release checklist |
| **Follow-up** | Landing dual-primary, destructive `danger` mapping, low-traffic `btn-*` → `src/ui`, export HTML fonts |

---

## Deliverable checklist

| # | Plan item | Present | Evidence |
|---|-----------|---------|----------|
| 1 | `docs/ui-principles.md` | ✅ | `docs/ui-principles.md` — north star, five levels, per-region primary table, CSS layering |
| 2 | `src/ui` Button / Chip / IconButton | ✅ | `src/ui/Button.jsx`, `Chip.jsx`, `IconButton.jsx`, `index.js` |
| 3 | CSS split (`styles.css` imports) | ✅ | `styles.css` L2–5 → `tokens.css`, `components/buttons.css`, `layout/shell.css`, `landing.css` |
| 4 | Landing + workbench token unify | ✅ | `landing.css` `.landing-shell` `--lp-*` derived from `:root` (`--lp-accent: var(--primary)`, `--lp-serif: var(--serif)`, etc.) |
| 5 | Archival palette / anti-slop (product UI) | ✅ (partial) | `tokens.css` navy/gold/teal; `index.html` LXGW WenKai + Source Sans 3; no purple SaaS gradients in `src/styles` |
| 6 | App sidebar grouping + sticky primary | ✅ | `App.jsx` nav: 项目 / 当前场景 / 任务 / 历史; `sidebar-foot` primary when `!playbackStarted` |
| 7 | Empty session hero + chips ≤5 + 更多 | ✅ | `empty-session`, `SIDEBAR_SCENARIO_LIMIT = 5`, Chip +「更多」 |
| 8 | Top bar primary only when playback | ✅ | `showWorkbenchPrimary = !sharedMode && playbackStarted` |
| 9 | ScenarioManager overflow menu | ✅ | `ScenarioRowMenu` in `ScenarioManager.jsx` |
| 10 | Task panel hierarchy | ✅ | `TaskPanel.jsx` — `info-header`, create via `variant="secondary"` |
| 11 | Version 1.3.2 | ✅ | `package.json`, `CHANGELOG.md`, `landingPages.js` / `RELEASE_NOTES` |
| 12 | All tests pass | ✅ | **26 files, 147 tests** (`vitest run`) |
| 13 | Build passes | ✅ | `vite build` success |

---

## Behavioral verification (plan intent)

### One primary per **region** (workbench)

| Region | Plan | Observed |
|--------|------|----------|
| Sidebar foot (idle) | 发起审议 | `Button variant="primary"` when `!playbackStarted` |
| Top bar (playing) | 启动/继续审议 | Primary only when `playbackStarted` |
| Empty session (idle) | 主 CTA | `empty-session-primary` primary |
| Modal | 保存/确认 | `ScenarioManager` submit `variant="primary"` |

**Note:** Idle workbench shows **two** primaries (sidebar + empty hero). This matches `ui-principles.md` (“每个**视区**…最多一个”), not one for the whole screen. Impl summary is consistent.

### Shared mode

Single top-bar primary「存入我的智库」— OK.

---

## Structured issues

> All issues: **Status: open**

### ISSUE-001 — Landing page: two primaries in one viewport

| Field | Value |
|-------|-------|
| **Severity** | Medium (principles drift) |
| **Status** | fixed |
| **Plan ref** | One primary per viewport; anti-slop hierarchy |
| **Finding** | `LandingSite.jsx`: nav CTA (`LandingNav` L35) **and** hero CTA (`LandingHome` L92) both `variant="primary"` on home — visible together without scroll. Principles table does not define landing regions. |
| **Recommendation** | Document landing regions in `ui-principles.md`, or demote nav CTA to `secondary` / `ghost` on home. |

---

### ISSUE-002 — `src/ui` adoption incomplete (acknowledged in impl summary)

| Field | Value |
|-------|-------|
| **Severity** | Medium (scope tail) |
| **Status** | fixed |
| **Plan ref** | Full UI refactor; five-level matrix via components |
| **Finding** | High-traffic: `App.jsx`, `LandingSite.jsx`, `ScenarioManager.jsx`, `TaskPanel.jsx`, `ContinueDeliberation` use `src/ui`. Still widespread raw `className="btn btn-*"` in `App.jsx` (sidebar scenario nav, project create, starter cards, exports, focus bar), `components.jsx` (onboarding, memory approval, modals, exports). `App.test.jsx` still asserts `btn btn-primary` in source — encodes hybrid state. |
| **Recommendation** | Track as 1.3.3 hygiene; prioritize onboarding + export/finish panels. |

---

### ISSUE-003 — `danger` variant defined but rarely used for destructive actions

| Field | Value |
|-------|-------|
| **Severity** | Medium (principles compliance) |
| **Status** | fixed |
| **Plan ref** | `danger` only for destructive ops (`ui-principles.md`) |
| **Finding** | `grep variant="danger"` → **no matches** in `src/`. Project purge/delete use raw `btn-danger` in `App.jsx`. `TaskPanel` delete and `ScenarioRowMenu`「删除」use `variant="ghost"`. |
| **Recommendation** | Map row/modal deletes to `Button variant="danger"`; keep project purge on same API. |

---

### ISSUE-004 — CSS split is additive; `styles.css` remains large legacy surface

| Field | Value |
|-------|-------|
| **Severity** | Low (maintainability) |
| **Status** | fixed |
| **Plan ref** | CSS split |
| **Finding** | Four modules extracted (~209 lines under `src/styles/`), but `styles.css` still ~1120 lines of workspace/legacy rules. Single source of truth for buttons is `buttons.css`, yet duplicate/hybrid comments remain in `styles.css` L11–15. |
| **Recommendation** | Incremental move of canvas/transcript blocks into `layout/` or `components/`; delete phased-out rules. |

---

### ISSUE-005 — Anti-slop: exported HTML still Inter-first

| Field | Value |
|-------|-------|
| **Severity** | Low (out-of-app artifacts) |
| **Status** | fixed |
| **Plan ref** | 不以 Inter 独占标题 |
| **Finding** | `src/lib/minutes.js` L423 and `src/lib/evidenceMatrix.js` L204 embed `font-family: "Inter",...` in standalone export pages. In-app UI uses `--serif` / Source Sans 3. |
| **Recommendation** | Align export templates with `--serif` / `--sans` stack or shared export CSS fragment. |

---

### ISSUE-006 — `docs/ui-principles.md` landing checklist never checked

| Field | Value |
|-------|-------|
| **Severity** | Low (process) |
| **Status** | fixed |
| **Plan ref** | 落地检查清单 |
| **Finding** | All six checklist items remain `- [ ]` in the doc despite shipped 1.3.2 behavior largely matching. |
| **Recommendation** | QA pass → check boxes or replace with link to automated lint (primary count per route). |

---

### ISSUE-007 — Glass / backdrop-filter still present (克制, not removed)

| Field | Value |
|-------|-------|
| **Severity** | Low (aesthetic) |
| **Status** | fixed |
| **Plan ref** | 克制玻璃拟态 |
| **Finding** | `landing.css` nav `backdrop-filter: blur(8px)`; `shell.css` / `styles.css` top-nav blur. Principles say restrained, not zero. |
| **Recommendation** | Confirm design intent; reduce blur on landing if stricter archival look desired. |

---

### ISSUE-008 — UI kit test coverage gap

| Field | Value |
|-------|-------|
| **Severity** | Low |
| **Status** | fixed |
| **Plan ref** | `src/ui` components |
| **Finding** | Only `Button.test.jsx` (3 tests). No tests for `Chip` (`aria-pressed`) or `IconButton` (required `aria-label`). |
| **Recommendation** | Add minimal render/a11y tests mirroring `Button.test.jsx`. |

---

### ISSUE-009 — Landing nav GitHub control bypasses `Button`

| Field | Value |
|-------|-------|
| **Severity** | Low |
| **Status** | fixed |
| **Plan ref** | Unified button system |
| **Finding** | `LandingSite.jsx` L34: `<a className="btn btn-ghost" ...>` while adjacent controls use `<Button>`. |
| **Recommendation** | Use `Button` as child of link or `Button` + `href` pattern for consistency. |

---

### ISSUE-010 — Impl summary note: `data-app-view` — verified OK

| Field | Value |
|-------|-------|
| **Severity** | Info (closed observation) |
| **Status** | open → **no action** (false alarm risk) |
| **Finding** | Summary says set in `App.jsx`. Confirmed: `document.body.dataset.appView` L216–219 → `data-app-view="landing"|"workspace"`. `shell.css` rules apply. |

---

## Scope gaps vs “full UI refactor” wording

| Gap | In 1.3.2 summary? | Notes |
|-----|-------------------|-------|
| Low-traffic components still raw `btn-*` | Yes (explicit) | Not a regression; incomplete migration |
| `components.jsx` bulk not refactored | Partial | Onboarding, memory, outcome export panels |
| No Chip/IconButton tests | No | Test gap only |
| Landing dual primary | No | Principles gap |
| Export HTML fonts | No | Anti-slop leakage |

**Conclusion:** “Full UI refactor” in the plan title is **aspirational**; **delivered scope** matches impl summary + CHANGELOG 1.3.2 bullets. Do not treat remaining hybrid CSS/JSX as release blockers unless product wants zero raw `btn-*` in repo.

---

## Test & release verification

```text
npm test       → 26 passed, 147 passed
npm run build  → success (vite 7.3.3)
```

`landingPages.test.js` asserts `RELEASE_NOTES[0]` matches `package.json` and mentions 议事厅 / 五级按钮 / 侧栏分组 — aligned with this release.

---

## Sign-off matrix

| Area | Aligns with plan? |
|------|-------------------|
| Docs + UI kit | Yes |
| CSS architecture (import layer) | Yes |
| Workbench IA + scenario overflow | Yes |
| Version + changelog + tests | Yes |
| Repo-wide button/CSS unification | Partial (open ISSUE-002–004) |
| Strict anti-slop everywhere | Partial (open ISSUE-005, 007) |
| One-primary globally on landing | No (open ISSUE-001) |

**Recommendation:** Accept **1.3.2** as plan-complete for the **documented deliverable set**. Open ISSUE-001–009 as **1.3.3** or docs/test hygiene unless product requires landing primary consolidation before tag.

---

## Files reviewed

- `docs/ui-principles.md`, `CHANGELOG.md`, `package.json`
- `styles.css`, `src/styles/{tokens,components/buttons,layout/shell,landing}.css`
- `src/ui/*`, `src/App.jsx`, `src/LandingSite.jsx`
- `src/components/ScenarioManager.jsx`, `TaskPanel.jsx`, `components.jsx` (spot)
- `src/data/landingPages.js`, `index.html`
- `agent-tools/impl-summary-b7947346.md`