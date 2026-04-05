## Context

The current dashboard direction includes a broader use-case launchpad pattern, while first-release product intent is a simpler experience: a single friendly assistant path. The existing dashboard shell already relies on localization resources, and the UI codebase has established patterns for localized copy, form controls, and lightweight client state.

This change needs to reduce cognitive load for first-time users while preserving future extensibility for multi-use-case expansion. It also introduces a guided assistant identity interview that must feel conversational, clear, and easy to revise.

## Goals / Non-Goals

**Goals:**
- Present a single first-release use case in dashboard context: friendly user assistant.
- After users start with the assistant, guide them through key identity questions and optional starter suggestions.
- Generate and persist `AGENT.md`, `SOUL.md`, and `USER.md` from the guided answers.
- Keep copy and labels localization-driven.
- Structure implementation so additional use cases can be reintroduced later without rewriting core UI foundations.

**Non-Goals:**
- Reintroducing multi-use-case chooser UI in this release.
- Building advanced prompt engineering templates or agent orchestration controls.
- Introducing server-side personalization pipelines beyond current storage/config capabilities.
- Expanding onboarding steps in this change.

## Decisions

1. Keep dashboard entry experience single-path (friendly assistant) instead of dynamic card grid.
- Rationale: matches first-release scope and reduces decision friction.
- Alternative considered: keep full launchpad but visually highlight one recommended card.
- Why not chosen: still presents unnecessary optionality and confusion for MVP.

2. Use a guided interview prompt rather than a single free-text assistant field.
- Rationale: users get clearer direction and provide structured identity details with less ambiguity.
- Alternative considered: one large free-text input.
- Why not chosen: free-form entries produce inconsistent quality and make artifact generation brittle.

3. Model output as three persisted identity artifacts: `AGENT.md`, `SOUL.md`, and `USER.md`.
- Rationale: separates assistant behavior, persona essence, and user profile into maintainable OpenClaw-compatible files.
- Alternative considered: store all identity data in one JSON/text blob.
- Why not chosen: less readable, harder to evolve, and not aligned with requested OpenClaw markdown artifacts.

4. Continue localization-first copy management for new and updated dashboard text.
- Rationale: consistent with existing dashboard shell requirements and i18n setup.
- Alternative considered: temporary hardcoded English copy.
- Why not chosen: breaks current product quality and localization workflow.

## Risks / Trade-offs

- [Risk] Single-use-case UI may feel restrictive to power users.
  - Mitigation: preserve internal structure for future expansion and communicate first-release scope in copy.

- [Risk] Guided answers may still be incomplete or low quality.
  - Mitigation: require core fields, validate required entries, and provide starter identity suggestions.

- [Risk] Generated artifact structure may drift across iterations.
  - Mitigation: define stable section templates per file and regenerate deterministically from latest answers.

- [Risk] Localization drift if new keys are added inconsistently.
  - Mitigation: enforce localization updates for both supported locales in the implementation tasks.
