> **Fix round 2026-06-02:** Priority fixes shipped. Tracker: `grok-review-b7947346.md`.

# Test Coverage Review — UI Refactor 1.3.2 (b7947346)

**Reviewer:** Test engineer  
**Scope:** `Button.test.jsx`, `landingPages.test.js` @ 1.3.2, missing `Chip` / `IconButton` tests, `App.test.jsx` meaningfulness  
**Baseline:** `agent-tools/impl-summary-b7947346.md`  
**Run:** `npm test` → 26 files, 147 passed (verified 2026-06-02)

---

## Executive summary

| Area | Verdict |
|------|---------|
| `Button.test.jsx` | Adequate **unit** smoke for the primitive; gaps on fallback / wrapper-specific behavior |
| `landingPages.test.js` | **1.3.2 release/version** covered; home/workflow tests still anchor **1.2.x** copy only |
| `Chip` / `IconButton` | **No dedicated tests** — refactor-specific wrappers untested |
| `App.test.jsx` | **Passes** but mostly **pre-1.3.2** contracts; weak guard on UI kit wiring |
| Workbench / scenario UX | **No tests** for sidebar ≤5, overflow menu, empty-session shell |

Overall: green suite gives **false confidence** for 1.3.2 UI goals. Data-layer tests (`landingPages`) are the strongest link to this release; component and App contracts lag the implementation.

---

## Findings

### 1. No `Chip.test.jsx` or `IconButton.test.jsx`

| Field | Value |
|-------|-------|
| **Severity** | suggestion |
| **Status** | fixed |
| **Files** | `src/ui/Chip.jsx`, `src/ui/IconButton.jsx`, `src/ui/index.js` |

**Issue:** Only `Button` has tests. `Chip` and `IconButton` are thin wrappers with **release-critical** behavior:

- **Chip:** `ui-chip` / `ui-chip--active`, `aria-pressed={active}`, default `variant="ghost"` + `size="sm"`, used in empty-session scenario/topic pickers (`App.jsx`).
- **IconButton:** mandatory `label` → `aria-label` + default `title`, `icon-btn-lite`, `active` class, default `variant="subtle"`, used in top bar and `ScenarioRowMenu`.

**Risk:** Regressions (dropped `aria-pressed`, missing `aria-label`, wrong variant) would not fail CI; `Button.test.jsx` does not exercise delegation.

**Recommendation:** Add SSR tests mirroring `Button.test.jsx`, e.g.:

```jsx
// Chip: active → aria-pressed="true", ui-chip--active, btn-ghost, btn-sm
// IconButton: label="菜单" → aria-label="菜单", icon-btn-lite, btn-subtle
```

---

### 2. `Button.test.jsx` — solid primitive smoke, incomplete contract

| Field | Value |
|-------|-------|
| **Severity** | suggestion |
| **Status** | fixed |
| **File** | `src/ui/Button.test.jsx` |

**Covered (good):**

- All five variants emit `btn-{variant}` + `btn-label`
- `loading` + `disabled` → `btn-loading`, `btn-spinner`, `disabled`, `aria-busy="true"`
- `size="sm"` → `btn-sm`

**Gaps:**

| Gap | Why it matters |
|-----|----------------|
| Unknown `variant` fallback to ghost (`VARIANT_CLASS[variant] \|\| VARIANT_CLASS.ghost`) | Prevents accidental class drift or silent breaks when adding variants |
| `className` merge on root | Hot paths pass `empty-session-primary`, `sidebar-primary-cta`, `template-chip` |
| `loading` → `btn-label--loading` | Loading UX is part of 1.3.2 primary CTAs |
| `type="submit"` (sidebar project create still uses raw `<button className="btn btn-primary">`) | N/A for `Button` today; optional |

**Note:** Project convention favors `renderToString` over RTL — consistent with existing UI tests; no need to add `@testing-library/react` for this review.

---

### 3. `landingPages.test.js` — 1.3.2 version/release OK; landing body still 1.2.x–locked

| Field | Value |
|-------|-------|
| **Severity** | suggestion |
| **Status** | fixed |
| **File** | `src/data/landingPages.test.js` |

**What works for 1.3.2:**

```39:52:src/data/landingPages.test.js
  test('landing version matches package.json', () => {
    expect(LANDING_SITE.zh.version).toBe(packageVersion);
    expect(LANDING_SITE.en.version).toBe(packageVersion);
    expect(RELEASE_NOTES[0].version).toBe(packageVersion);
  });

  test('RELEASE_NOTES includes current version with EN highlights', () => {
    const release = RELEASE_NOTES.find((r) => r.version === packageVersion);
    expect(release).toBeDefined();
    expect(release.highlights.join(' ')).toMatch(/议事厅|五级按钮|发起审议|侧栏分组/i);
    // ...
  });
```

- Version sync with `package.json` (`1.3.2`) ✓  
- First matching release block asserts zh highlights for 议事厅 / 五级按钮 / 发起审议 / 侧栏分组 ✓  
- EN localized notes: `Archival UI`, `five-level button`, `Start deliberation` ✓  
- zh/en structural parity ✓  

**Gaps:**

| Gap | Severity | Detail |
|-----|----------|--------|
| Two `RELEASE_NOTES` entries at `1.3.2` | nit | `find()` only validates the **first** block; second block (scenario guide / scroll / animation) has **no** dedicated assertions |
| Home/workflow tests named `1.2.x capabilities` | nit | Names/docs stale; assertions still valid but do not mention 1.3.2 UI/marketing |
| No markers for 1.3.2 on `LANDING_SITE` body | suggestion | e.g. no check that `home.deck` / FAQ / workflow mention archival UI, sidebar grouping, or five-level buttons — only `RELEASE_NOTES` enforces refactor messaging |
| Duplicate version rows | nit | `RELEASE_NOTES[0]` and `[1]` both `1.3.2`; test `RELEASE_NOTES[0].version` is brittle if order changes |

**Recommendation:** Add `ZH_13X_MARKERS` / `EN_13X_MARKERS` (or extend existing blobs) for copy you expect on the public site, not only in changelog bullets; assert **both** 1.3.2 `RELEASE_NOTES` rows or merge notes in data.

---

### 4. `App.test.jsx` — passes but does not meaningfully guard 1.3.2 UI refactor

| Field | Value |
|-------|-------|
| **Severity** | bug |
| **Status** | fixed |
| **File** | `src/App.test.jsx` |

**What still provides value:**

- Test 1: SSR landing shell strings (hero, nav sections, GitHub, no workbench textarea / playback chrome) — **meaningful** for landing-first routing.
- Test 2: Source contract for `resolveAppView`, `LandingSite`, `enterWorkbench`, `topic-input` — **meaningful** for view split.
- Test 3: Large static grep for projects, memory, outcome, history, evidence matrix — **meaningful** for **1.2.x–1.3.0** feature retention, not for UI kit.

**Why this is a bug (test meaning), not a product bug:**

Test 3 asserts legacy patterns that **coexist** with the refactor:

```47:49:src/App.test.jsx
    expect(source).toContain('btn btn-primary');
    expect(source).toContain('btn btn-ghost');
```

`App.jsx` still contains raw `btn btn-*` (e.g. `starter-card`, project-create submit, export HTML). A developer could **remove** `import { Button, Chip, IconButton } from './ui'` and **delete** `<Button variant="primary">` sidebar/empty CTAs while leaving stray `btn btn-primary` strings — **test 3 would still pass**.

**Not asserted anywhere in `App.test.jsx` (1.3.2 impl-summary items):**

| Expected contract | Present in `App.jsx` | Tested |
|-------------------|----------------------|--------|
| `./ui` import + `<Button` / `<Chip` / `<IconButton` | Yes | No |
| `empty-eyebrow` / 议事厅 empty session | Yes | No |
| Sidebar sticky `发起审议` via `<Button variant="primary">` | Yes | No |
| `SIDEBAR_SCENARIO_LIMIT` / `hasMoreScenarios` / chip「更多」 | Yes | No |
| `workbench-tasks` / `workbench-history` anchors | Yes | No |
| `ScenarioRowMenu` | In `ScenarioManager.jsx` | No |

**Recommendation:** Extend test 3 (or add test 4) with source or SSR checks for UI kit usage and 1.3.2 shell strings; optionally `renderToString` with mocked `viewMode: 'workspace'` if feasible without heavy setup.

---

### 5. `ScenarioManager` / overflow menu — zero test coverage

| Field | Value |
|-------|-------|
| **Severity** | suggestion |
| **Status** | fixed |
| **Files** | `src/components/ScenarioManager.jsx` |

**Issue:** `ScenarioRowMenu` + `IconButton` overflow is called out in impl-summary; no `*.test.*` references `ScenarioManager`, `ScenarioRowMenu`, or row menu a11y (`aria-expanded`, focus trap).

**Recommendation:** Minimal SSR or source test: menu trigger has `aria-label`, row actions not rendered as a row of primary buttons.

---

### 6. Style split (`tokens.css`, `buttons.css`, `shell.css`, `landing.css`) — untested

| Field | Value |
|-------|-------|
| **Severity** | nit |
| **Status** | fixed |
| **Files** | `styles.css`, `src/styles/*` |

**Issue:** No test asserts `@import` chain or presence of `.ui-chip` / `.icon-btn-lite` in `buttons.css` (workspace test only checks `.history-item-main` wrapping).

**Recommendation:** One test reading `styles.css` for import paths + `.ui-chip` rules (same pattern as `components.workspace.test.js`).

---

### 7. Sidebar scenario cap (≤5) — behavior untested

| Field | Value |
|-------|-------|
| **Severity** | suggestion |
| **Status** | fixed |
| **Files** | `src/App.jsx` (`SIDEBAR_SCENARIO_LIMIT = 5`) |

**Issue:** `sidebarScenarios = allScenarios.slice(0, 5)` and `hasMoreScenarios` drive empty-state and sidebar chips; no unit test with mocked scenario list length 6 →「更多」visible.

**Recommendation:** Extract limit constant test in `scenarios.test.js` or source contract `SIDEBAR_SCENARIO_LIMIT` + `hasMoreScenarios` in `App.test.jsx`.

---

## Coverage matrix (1.3.2 UI refactor)

| Deliverable | Implementation | Automated test |
|-------------|----------------|----------------|
| Five-level `Button` | `src/ui/Button.jsx` | `Button.test.jsx` (partial) |
| `Chip` selectable | `src/ui/Chip.jsx` | — |
| `IconButton` a11y | `src/ui/IconButton.jsx` | — |
| Landing release 1.3.2 | `landingPages.js` | `landingPages.test.js` (release + version) |
| Landing body copy 1.3.2 | `LANDING_SITE` | Only via 1.2.x markers |
| App workbench shell | `App.jsx` | `App.test.jsx` (landing + legacy grep) |
| Scenario overflow menu | `ScenarioManager.jsx` | — |
| CSS modular imports | `styles.css` | — |

---

## Suggested test backlog (priority)

1. **P0:** `Chip.test.jsx`, `IconButton.test.jsx` (SSR, a11y + classes).  
2. **P0:** Extend `App.test.jsx` — `from './ui'`, `<Chip`, `<IconButton`, `发起审议`, `empty-eyebrow`, `SIDEBAR_SCENARIO_LIMIT`.  
3. **P1:** `landingPages` — 1.3.2 body markers + both release note blocks.  
4. **P1:** `Button.test.jsx` — invalid variant, `className`, `btn-label--loading`.  
5. **P2:** `ScenarioManager` / `ScenarioRowMenu` smoke; `styles.css` import + `.ui-chip` contract.

---

## Conclusion

The suite **passes** and correctly locks **version 1.3.2** and **release-note bullets** for the UI refactor. It does **not** adequately lock the **UI kit surface** (`Chip`, `IconButton`, `App` wiring) or **workbench UX** changes from the same release. Treat `App.test.jsx` test 3 as a **feature-regression** guard, not a **1.3.2 UI** guard until extended.