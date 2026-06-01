# Product Reinvention Goal — Complete Product Upgrade

**Date:** 2026-05-30  
**Status:** Active top-level goal  
**Related North Star:** `docs/north-star-goal.md`  
**Strategic frame:** Path A first — extreme local professional workbench; GitHub-ready public product only after the local product feels complete.

## One-Sentence Goal

Upgrade AI Roundtable Room from a strong working prototype into a complete, GitHub-ready product whose every screen, button, phrase, state, and interaction makes users feel: this is a serious thinking instrument for high-stakes decisions, not an AI demo.

## Why This Goal Exists

The project already has a strong core: structured multi-perspective deliberation, project memory, human approval gates, local-first privacy, exportable decision packets, and a self-documenting engineering culture.

The next leap is not another isolated feature. The next leap is product-level coherence.

Users should not need to understand the architecture to trust the product. The interface itself must explain what to do, why it matters, what is happening, what can be trusted, and what action comes next. Every detail should reduce cognitive friction and increase confidence.

## Product Mindset Shift

We are no longer polishing a demo. We are finishing a product.

| From | To |
| --- | --- |
| Feature works | User understands why and when to use it |
| UI looks acceptable | UI guides attention and builds trust |
| Buttons trigger actions | Buttons express clear intent, risk, and next step |
| Many AI messages | Structured judgment, conflict, evidence, and action |
| Interesting prototype | Reliable local professional workbench |
| Docs explain setup | Product experience explains itself |
| Code can run locally | Repository is ready for public GitHub evaluation |

## Core Product Promise

A user should be able to open the app, enter a complex question, and feel guided through a serious deliberation process that helps them:

1. define the real problem;
2. see competing perspectives;
3. identify evidence, assumptions, and risks;
4. preserve meaningful disagreement;
5. choose a next action;
6. save useful memory for future decisions;
7. export or share a credible decision artifact.

If any screen, button, state, or copy does not support this promise, it must be redesigned, removed, or downgraded.

## User Mind Audit

Every product decision must be evaluated from the user's mental state.

### Before the first action

The user is asking:

- What is this tool actually for?
- What kind of question should I enter?
- Why is this better than asking one chatbot?
- Is my API key or project data safe?
- Will this cost tokens unexpectedly?

The product must answer these questions without making the user read a long manual.

### During deliberation

The user is asking:

- What is happening right now?
- Which perspective is speaking, and why does it matter?
- Is this claim evidence, inference, assumption, or opinion?
- Where are the real disagreements?
- Should I interrupt, continue, regenerate, or stop?

The interface must make progress, roles, evidence, conflict, and next choices visible.

### After deliberation

The user is asking:

- What did we actually decide?
- What remains uncertain?
- What should I do next?
- What should be saved into project memory?
- Can I export this as a credible artifact?
- Can I continue from here later?

The ending state must feel like a decision packet, not a chat transcript.

## Scope of the Upgrade

This is a whole-product upgrade, not a CSS-only pass.

### 1. Information architecture

- Make the main workflow obvious: question → protocol → deliberation → decision packet → memory/export/next step.
- Reduce competing panels and unclear hierarchy.
- Make project memory, evidence, risks, and actions feel like first-class product concepts.
- Ensure empty, loading, error, success, and completed states each have a clear purpose.

### 2. User onboarding and first-run clarity

- The first screen must teach the correct use case through examples, not marketing fluff.
- Missing API key state must clearly explain demo mode vs real generation.
- Setup guidance should be visible at the point of need.
- The user should know what a good roundtable question looks like before typing.

### 3. Button-level product craft

Every button must pass this test:

- Is the label specific enough?
- Is the visual weight proportional to the importance and risk?
- Does it imply what happens next?
- Does it distinguish reversible vs irreversible actions?
- Does it have clear hover, focus, active, disabled, loading, and success states?
- Is the placement where the user expects it at that moment?

Primary actions should be rare and obvious. Secondary actions should not compete. Dangerous or irreversible actions must remain visually and behaviorally distinct.

### 4. Microcopy and tone

- Remove toy, gimmick, role-play, and vague AI-demo language.
- Prefer calm, precise, professional language.
- Explain product concepts in user terms: decision, risk, evidence, memory, next action.
- Avoid inflated claims. Trust comes from clarity and restraint.
- Every empty state should help the user make the next good move.

### 5. Visual system and UI texture

- Use the existing professional direction as the base: deep navy authority, restrained accent, strong hierarchy, high readability.
- Tighten spacing, alignment, typography scale, and panel hierarchy.
- Make the product feel durable, calm, and serious under long use.
- Preserve accessibility: keyboard focus, contrast, mobile hit areas, readable long Chinese/English text.
- Avoid decorative complexity that does not improve judgment quality.

### 6. Deliberation experience

- Make phases understandable at a glance.
- Make each perspective's function clearer than its personality.
- Surface disagreement, risk, assumptions, and evidence more strongly than ordinary chat text.
- Make generating progress feel purposeful, not like random AI streaming.
- Give users meaningful intervention points: continue, ask follow-up, regenerate, save memory, export.

### 7. Decision packet and memory

- The final output must feel like the product's core artifact.
- Decision packet sections should be scannable, credible, and reusable.
- Project memory approval must feel important and trustworthy, not like a side panel.
- Saved memory should represent durable judgment: decisions, risks, assumptions, actions, and reopen conditions.

### 8. Reliability and readiness

- Keep tests green and expand coverage where product flows become more important.
- Preserve local-first privacy and server-side key handling.
- Keep `npm run doctor`, `npm test`, `npm run build`, and `npm run check` as release gates.
- Avoid large rewrites unless a user-facing product problem justifies them.

### 9. GitHub public presentation

The repository must be ready for a serious GitHub visitor.

- README should clearly show what the product is, why it matters, how to run it, and what makes it different.
- Screenshots and demo assets should reflect the upgraded UI, not an older state.
- Setup should be simple and honest.
- Architecture, roadmap, and strategic decision docs should align with the actual product.
- No stale claims, broken commands, missing assets, or confusing project names.

## Non-Negotiable Product Standards

A change is not complete unless it improves at least one of these:

1. user clarity;
2. user trust;
3. decision quality;
4. evidence/risk visibility;
5. actionability;
6. continuity through project memory;
7. public product credibility.

A change should be rejected if it only adds novelty, decoration, AI theater, or implementation complexity.

## Completion Definition

This goal is complete only when all of the following are true:

1. **Golden path works:** A new user can open the app, understand what to do, run or inspect a roundtable, read the decision packet, and know the next step.
2. **Every major state is designed:** first-run, demo, missing config, idle, generating, completed, error, history restore, memory review, export.
3. **Every major button is intentional:** label, hierarchy, placement, risk level, and interaction states are reviewed.
4. **UI feels product-grade:** spacing, typography, colors, panels, focus states, mobile behavior, and dark/light modes are coherent.
5. **Product language is mature:** no toy/demo framing in primary UX; concepts are named consistently.
6. **Trust signals are visible:** local-first privacy, key handling, evidence status, model/source metadata, memory approval, and export provenance are understandable.
7. **Verification passes:** `npm run doctor`, `npm test`, `npm run build`, and `npm run check` pass.
8. **Manual product smoke passes:** the app is launched and the golden path is tested in browser, including at least one edge state.
9. **Docs match product:** README, roadmap/progress, architecture notes, and screenshots/demo assets are updated if affected.
10. **GitHub-ready:** changes are committed when requested, pushed to GitHub when explicitly approved, and the repository presents as a serious usable product.

## Operating Rules for the Upgrade

- Start from user mind, not component inventory.
- Research existing code before editing.
- Reuse existing components, tokens, and product concepts where possible.
- Prefer small, verifiable improvements over speculative rewrites.
- Protect the working system: generation, project memory, approval gates, provider config, exports, history, tests.
- Do not add accounts, cloud sync, or collaboration until local excellence is complete.
- Every implementation phase must include browser verification for UI changes.
- Keep the living docs loop updated as the product changes.

## Recommended Execution Phases

### Phase 1 — Product audit

Map the current product from the user's perspective:

- entry screen;
- setup/demo state;
- input and protocol selection;
- generating state;
- deliberation reading experience;
- decision packet;
- memory review;
- history and continuation;
- export;
- README/GitHub presentation.

Deliverable: a prioritized punch list of product gaps ranked by user impact.

### Phase 2 — First-run and golden path redesign

Make the first 5 minutes excellent. A user should understand the product, enter a good question, and trust what happens next.

Deliverable: upgraded onboarding/empty states, setup guidance, primary action hierarchy, and golden path UX.

### Phase 3 — Deliberation and decision artifact upgrade

Make the core roundtable experience feel like structured judgment rather than chat.

Deliverable: clearer phase/progress model, stronger evidence/risk/disagreement treatment, improved decision packet and memory approval experience.

### Phase 4 — UI detail pass

Review every button, control, panel, spacing rule, focus state, loading state, disabled state, and mobile interaction.

Deliverable: polished product surface with consistent design tokens and interaction behavior.

### Phase 5 — Verification, docs, and GitHub readiness

Run full gates, update docs/assets, perform browser smoke, and prepare for GitHub upload.

Deliverable: verified repository ready for public presentation and push after explicit approval.

## Final Target

When this goal is finished, AI Roundtable Room should feel like a finished local professional product: focused, trustworthy, polished, self-explanatory, and worth starring on GitHub.

The product should not merely demonstrate that multiple AI roles can talk. It should prove that structured AI deliberation can help a serious user think, decide, and act better.
