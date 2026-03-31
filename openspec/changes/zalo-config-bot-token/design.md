## Context

The application currently supports gateway-backed configuration reads and path-targeted writes via `config.set`, but the Zalo configuration UI does not enforce bot token capture when a channel is unconfigured or unpaired. This leads to partially configured channel state and user confusion during setup.

This change spans UI flow behavior and configuration write logic:
- UI must detect incomplete Zalo setup state and collect a bot token.
- Config writes must target `channels.zalo` using existing non-destructive patching semantics.

Stakeholders are onboarding users configuring Zalo for the first time and operators maintaining existing channel settings without regressions.

## Goals / Non-Goals

**Goals:**
- Ensure Zalo setup flow prompts for bot token whenever channel is not configured or paired.
- Persist Zalo channel settings through `config.set` at path `channels.zalo`.
- Preserve unrelated configuration branches during writes.
- Keep UX deterministic with clear validation and actionable errors.

**Non-Goals:**
- Redesign the full onboarding journey or unrelated settings screens.
- Introduce new gateway endpoints beyond current `config.get`/`config.set` integration.
- Change non-Zalo channel schemas.

## Decisions

1. Use explicit Zalo readiness predicate in UI state.
- Decision: derive an `isZaloReady`/`needsToken` condition from normalized config state and pairing metadata.
- Rationale: keeps prompting logic local and testable, preventing implicit checks spread across components.
- Alternative considered: always require token field regardless of status. Rejected because it forces unnecessary re-entry for already paired installations.

2. Use path-targeted write to `channels.zalo` through existing config layer.
- Decision: construct/update only the `channels.zalo` branch in the patch payload and submit through existing `config.set` flow.
- Rationale: aligns with current non-destructive update requirements and minimizes regression risk.
- Alternative considered: replace whole `channels` object. Rejected because it risks clobbering other channel configurations.

3. Keep validation blocking for incomplete token input only when setup is incomplete.
- Decision: token field is required if Zalo is not configured or paired; optional/no-op otherwise unless user edits it.
- Rationale: balances first-time setup correctness with low-friction maintenance.
- Alternative considered: soft warning without blocking. Rejected because it allows invalid partial setup.

4. Preserve read-after-write consistency via existing refresh pattern.
- Decision: after successful `config.set`, refresh normalized configuration and reflect updated Zalo status in UI.
- Rationale: ensures immediate consistency and avoids stale prompts.

## Risks / Trade-offs

- [Risk] Incorrect readiness detection could over-prompt or under-prompt for token.
  Mitigation: isolate predicate logic and add unit/component tests for configured, unconfigured, and paired/unpaired states.

- [Risk] Writing incorrect object shape under `channels.zalo` could break downstream consumers.
  Mitigation: use typed config model and validate expected Zalo branch fields before write.

- [Trade-off] Conditional required validation adds flow complexity.
  Mitigation: centralize validation rule and reuse across onboarding/settings entry points.

## Migration Plan

1. Add/adjust normalized model mapping for Zalo readiness fields if missing.
2. Update Zalo configuration UI to conditionally require bot token and surface validation.
3. Wire submit handler to write `channels.zalo` through path-targeted `config.set` updates.
4. Add tests for prompt conditions, validation gating, and write payload shape.
5. Verify read-after-write behavior updates UI status without reload.

Rollback strategy:
- Revert UI conditional validation and restore previous submit behavior.
- Revert Zalo path-specific write changes to prior config update logic.

## Open Questions

- Which exact field(s) in normalized state are authoritative for "paired" vs "configured" in all environments?
- Should token masking/edit behavior differ between onboarding and settings contexts?