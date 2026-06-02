# Implementation Summary — UI Refactor 1.3.2

**Version:** 1.3.2  
**Commit message:** `feat(ui): 1.3.2 议事厅视觉重构与统一按钮体系`

## Design decisions

- **Archival north star:** Navy `--primary`, gold `--accent`, teal `--teal`; Chinese titles on `--serif` (LXGW WenKai via CDN); body `--sans` without Inter-first stack.
- **Five button levels only:** `primary` | `secondary` | `ghost` | `subtle` | `danger` — enforced via `src/ui/*` mapping to `.btn-*` classes.
- **One primary per viewport region:** Empty session hero + sticky sidebar foot own primary when idle; top bar primary only during `playbackStarted`; shared mode keeps single save primary.
- **CSS split:** `styles.css` imports `tokens.css`, `buttons.css`, `shell.css`, `landing.css`; landing `--lp-*` derived from workspace palette (fixed light chamber on `.landing-shell`).
- **Scenario noise reduction:** Row actions collapsed to overflow menu (`ScenarioRowMenu`); sidebar shows ≤5 scenarios +「更多」.

## Files changed

| Area | Files |
|------|--------|
| Docs | `docs/ui-principles.md` |
| UI kit | `src/ui/Button.jsx`, `Chip.jsx`, `IconButton.jsx`, `index.js`, `Button.test.jsx` |
| Styles | `styles.css`, `src/styles/tokens.css`, `components/buttons.css`, `layout/shell.css`, `landing.css` |
| Workbench | `src/App.jsx` |
| Components | `src/components/ScenarioManager.jsx`, `TaskPanel.jsx`, `components.jsx` (ContinueDeliberation) |
| Landing | `src/LandingSite.jsx`, `index.html` |
| Release | `package.json`, `CHANGELOG.md`, `src/data/landingPages.js`, `landingPages.test.js` |

## Screens touched

- **Landing:** Nav CTA + hero (primary/secondary), explore grid hover/focus, scenario guide CTAs; serif headlines.
- **Workbench sidebar:** 项目 / 当前场景 / 任务 / 历史; sticky「发起审议」; scroll anchors to `#workbench-tasks` / `#workbench-history`.
- **Empty session:** Eyebrow copy, primary CTA block, scenario chips (5 + 更多), ghost「管理场景」.
- **Top bar:** `IconButton` for menu/focus/home; primary only when playback active.
- **Scenario manager modal:** Overflow menu per row; footer/actions on `Button`.
- **Info panel:** Task panel hierarchy (`secondary` create),「历史」header.

## Tests & build

```text
npm test   → 26 files, 147 tests passed
npm run build → success (vite)
```

## Notes

- `body[data-app-view]` unchanged (`landing` | `workspace`) — already set in `App.jsx`.
- Remaining raw `btn btn-*` in low-traffic components (onboarding, exports) still valid via shared CSS; high-traffic paths wired to `src/ui`.