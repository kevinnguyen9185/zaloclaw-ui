## Context

The onboarding model step already supports OpenRouter key setup and model selection, but it does not take OpenClaw default model configuration into account. Users must manually pick a model even when OpenClaw has a configured default, which creates friction and can cause mismatch between expected and selected runtime model.

The project already has a gateway config route and model-list fetch flow, so this change extends existing step-2 behavior rather than adding a new step.

## Goals / Non-Goals

**Goals:**
- Detect configured default model from OpenClaw during onboarding step 2.
- Preselect that default model in the dropdown when the configured model exists in fetched models.
- Keep existing manual selection behavior intact when no default exists or when configured default is unavailable.
- Preserve current Next and save flow with minimal UX disruption.

**Non-Goals:**
- Changing backend model selection semantics beyond UI preselection.
- Adding a new onboarding step or changing step order.
- Auto-advancing to next step without user confirmation.
- Persisting additional model configuration beyond existing selection APIs.

## Decisions

1. Use existing gateway config route as source of default-model metadata.
- Decision: Read default-model information from the existing gateway config fetch path in step 2.
- Rationale: Keeps a single source of truth for OpenClaw runtime config and avoids introducing a second config contract.
- Alternative: Add a dedicated default-model endpoint. Rejected to avoid unnecessary API surface.

2. Apply preselection only when there is an exact match in models.list data.
- Decision: Compare configured default model identifier to dropdown model identifiers and preselect only on exact match.
- Rationale: Prevents ambiguous mapping and unintended selection.
- Alternative: Fuzzy match by name/provider. Rejected because it may select the wrong model.

3. Preserve user override behavior.
- Decision: If user manually changes selection, user choice remains authoritative for the session.
- Rationale: Preselection is a convenience, not a lock.
- Alternative: Hard-lock to configured default. Rejected because it limits user control.

4. Keep non-blocking fallback behavior.
- Decision: If config fetch fails or default is not found, render dropdown normally with no preselected value.
- Rationale: Avoids blocking onboarding on optional convenience behavior.
- Alternative: Block until config resolves. Rejected due to degraded UX and unnecessary dependency.

## Risks / Trade-offs

- [Config/model ID shape mismatch] -> Mitigation: normalize both config default identifier and models list identifiers before comparison.
- [Race between config fetch and model list fetch] -> Mitigation: run deterministic selection update after both data sources resolve.
- [Unexpected overwrite of user selection] -> Mitigation: only auto-select when current selection is empty or still default-derived.
- [Gateway config unavailable] -> Mitigation: graceful fallback to current manual selection path and clear retry messaging.

## Migration Plan

1. Extend model step data loading to read default model from config.
2. Add selection reconciliation logic between config default and models list.
3. Keep existing save and next actions unchanged.
4. Add test coverage for default-match, default-missing, and config-failure cases.
5. Validate with test suite and production build.

Rollback:
- Remove preselection reconciliation logic and return to current manual-only model selection.

## Open Questions

- Exact field path in gateway config that carries default model identifier in all OpenClaw versions.
- Whether default model should be shown with explicit label text such as Default from OpenClaw in the dropdown item or helper text.
