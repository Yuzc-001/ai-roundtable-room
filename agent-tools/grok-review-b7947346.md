# Grok Review — Consolidated Tracker (UI 1.3.2)

**Fix round:** 2026-06-02  
**Commit:** `fix(ui): address 1.3.2 review — primary hierarchy, a11y, mobile nav`  
**Verification:** `npm test` → 29 files, **155 passed** · `npm run build` → OK

## Summary

| Review doc | Issues | Fixed in round | Deferred / partial |
|------------|--------|----------------|---------------------|
| general.md | 18 | 16 | 2 (full App split, @import perf) |
| general-2.md | 15 | 15 | 0 |
| general-3.md | 13 | 11 | 2 (CDN self-host, full CSS co-location) |
| tests.md | 7 | 7 | 0 |
| plan.md | 10 | 9 | 1 (repo-wide raw `btn-*` migration → 1.3.3) |

## Fix highlights

### Primary hierarchy
- Idle: **empty-session** owns `primary`; sidebar uses **secondary** + shared `primaryActionLabel`
- Hidden sidebar start when `projectCreatorOpen` or `onboarding.shouldShow`
- Top-bar primary only when `playbackStarted && !showVote`
- Finish: export HTML **primary**; continue deliberation **secondary**; memory approve **secondary**

### Mobile (G2-01)
- `data-mobile-info-panel="open"` shows **info-panel** drawer on ≤768px; backdrop button dismisses

### Landing dark (G2-02–04)
- `data-theme="light"` on landing route; `.landing-shell` pins full chamber tokens + `.btn-secondary`

### A11y
- Scenario menu: `aria-expanded`, Escape, focus first item
- Scenario dialog: `aria-modal`, Escape, focus close on open
- Mobile backdrops: `<button aria-label>`

### CSS
- `.top-nav` `color-mix` background; nav/copy active → teal tint; focus ring scoped to non-`.btn`
- BOM stripped from CSS; `.project-form-actions` no longer overrides `.btn`

### Tests
- `Chip.test.jsx`, `IconButton.test.jsx`, `styles-import.test.js`, stronger `App.test.jsx`, landing 1.3.2 explore/release asserts

## Source reviews

- `grok-review-b7947346-general.md`
- `grok-review-b7947346-general-2.md`
- `grok-review-b7947346-general-3.md`
- `grok-review-b7947346-tests.md`
- `grok-review-b7947346-plan.md`

All priority items marked **fixed** in those files with **Response** notes.