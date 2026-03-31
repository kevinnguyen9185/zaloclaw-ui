## Context

The current onboarding model screen mixes three different concerns: entering provider details, typing a model identifier manually, and saving the selected primary model. The repo already contains model-selection helpers that can derive a stable dropdown list from gateway session data and preserve the current primary model as a fallback, but the page still uses text inputs and a test-first save flow that is heavier than the simplified behavior now requested.

This change affects both the onboarding UI and the config write path. The simplified flow still needs to load the current primary model from config, present a safe list of selectable models, and persist the chosen value without overwriting provider configuration or unrelated branches.

## Goals / Non-Goals

**Goals:**
- Replace manual provider and model entry with a single guided primary-model dropdown.
- Preselect the current primary model when the step loads.
- Populate the dropdown from gateway-visible model options while ensuring the persisted primary model remains selectable even if it is not returned in the latest list.
- Save the selected primary model through a non-destructive config update.
- Keep onboarding feedback clear for loading, empty-state, save-success, and save-failure conditions.

**Non-Goals:**
- Reworking provider credential onboarding or adding new provider management flows.
- Testing provider credentials from this step.
- Editing provider-scoped API keys or model registries as part of primary-model selection.
- Changing dashboard or settings model-selection behavior outside onboarding.

## Decisions

1. Use gateway-discovered model options as the dropdown source
- Decision: Build the dropdown from the existing session-model discovery helper and merge in the currently persisted primary model when it is absent from the latest session payload.
- Rationale: This avoids freeform entry while still preserving access to the active saved model.
- Alternative considered: Build the dropdown from static provider catalogs or provider config branches only.
- Why not now: Static catalogs do not reflect the live model inventory, and provider config branches may contain incomplete or stale data for onboarding choices.

2. Treat the dropdown value as a primary-model reference
- Decision: The selection control should use the full primary-model identifier string as its value and submit that exact value for persistence.
- Rationale: The config source of truth is already `agents.defaults.model.primary`, so the UI should select and save against the same identifier instead of splitting provider and model into separate transient fields.
- Alternative considered: Continue managing separate provider and model fields in the page state.
- Why not now: That preserves the same manual-entry complexity the change is intended to remove.

3. Scope save operations to primary-model persistence
- Decision: Saving from this screen updates `agents.defaults.model.primary` and keeps the existing path-targeted config write flow, without mutating provider API keys or provider model registries.
- Rationale: The requested interaction is choosing a primary model from known options, not provisioning or validating providers.
- Alternative considered: Preserve the current save flow that also reconciles provider config branches.
- Why not now: It couples a simple dropdown change to unrelated credential persistence and increases the chance of accidental config churn.

4. Preserve usability when no model choices are available
- Decision: If no selectable models are returned, the screen should show an explicit empty-state message, keep the dropdown disabled, and block save.
- Rationale: A blank or broken control would be ambiguous and lead to accidental no-op saves.
- Alternative considered: Allow manual text fallback when discovery fails.
- Why not now: That reintroduces the same error-prone manual flow being removed.

5. Reset onboarding state based on persisted save result
- Decision: After a successful save, refresh the config-backed state, update onboarding context with the persisted primary model, and keep the saved selection visible in the dropdown.
- Rationale: This keeps the screen consistent with the stored configuration and avoids stale local state.
- Alternative considered: Optimistically update local state without reloading config.
- Why not now: A read-after-write refresh is already consistent with the repo's config service expectations.

## Risks / Trade-offs

- [Session model discovery omits some configured models] -> Mitigation: merge the persisted primary model into the dropdown options as a fallback so the current selection is never lost.
- [Users may expect provider testing on this step] -> Mitigation: update copy so the step clearly communicates it is selecting the active primary model, not configuring credentials.
- [Saving only the primary reference may leave stale legacy fields in older configs] -> Mitigation: rely on the existing normalized config layer to read from `agents.defaults.model.primary` as the source of truth.
- [Empty model lists can block onboarding progression] -> Mitigation: surface an actionable empty-state message instead of a silent disabled form.

## Migration Plan

1. Update onboarding model-step loading to combine the current primary model from config with the discovered model-option list.
2. Replace the provider/model text inputs and read-only current-primary field with a single dropdown and empty-state messaging.
3. Simplify the save action to persist only the selected primary-model reference through the existing config service.
4. Adjust localization keys and tests to reflect the dropdown-driven workflow.

Rollback strategy:
- Restore the previous model-step form and save handler if the simplified dropdown flow fails to load or persist primary model selection reliably.

## Open Questions

- Should the dropdown labels display raw model identifiers only, or combine display name and provider when available from the discovered model list?
- If session discovery returns duplicates with different display names, which label should be preferred in the merged dropdown option?