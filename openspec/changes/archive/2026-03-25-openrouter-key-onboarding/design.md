## Context

The onboarding flow currently assumes models are already available from the gateway. In practice, many users arrive without an OpenRouter account or API key, so step 2 stalls before they can select a model. The project already has an onboarding model step and gateway RPC integration, so this change extends that step with a guided account setup path and key persistence path.

Key constraints:
- The UI must remain simple for first-time users.
- API keys are sensitive and must not be logged.
- Configuration persistence must be delegated to gateway-side config handling (source of truth for `openclaw.json`).
- Existing model listing (`models.list`) and session update (`sessions.patch`) behavior must continue to work.

## Goals / Non-Goals

**Goals:**
- Let users open OpenRouter website from step 2 to register/get an API key.
- Let users input an existing OpenRouter API key directly in step 2.
- Persist that key into gateway configuration (`openclaw.json`) through a controlled call path.
- Provide explicit success/error states and allow retry.
- Keep model selection in the same step after key setup.

**Non-Goals:**
- Building a full OpenRouter account management UI.
- Storing OpenRouter secrets in app server storage.
- Editing arbitrary gateway config fields unrelated to OpenRouter.
- Redesigning the entire onboarding flow.

## Decisions

1. Add a dual-path UI inside step 2.
- Decision: Add a compact panel with two actions: "Create OpenRouter account" (external link) and "I already have a key" (key input and save).
- Rationale: Covers both first-time and returning users without extra routes.
- Alternative considered: Separate onboarding step for key setup. Rejected to avoid increasing wizard length and user drop-off.

2. Persist key through gateway-config write endpoint.
- Decision: Save key via a dedicated UI-triggered gateway config write path that updates the OpenRouter key field in `openclaw.json`.
- Rationale: Gateway owns runtime config and file writes; keeps browser app stateless and avoids direct filesystem writes from UI.
- Alternative considered: Store key only in browser localStorage. Rejected because models depend on gateway-side config and server restart behavior.

3. Mask and redact key handling in UI.
- Decision: Use password field semantics, avoid rendering full key after save, and avoid logging key content.
- Rationale: Reduces accidental disclosure in screenshots, console, and error telemetry.
- Alternative considered: Plain text input for ease of debugging. Rejected for security hygiene.

4. Refresh model list after successful key save.
- Decision: Trigger `models.list` reload immediately after successful config write.
- Rationale: User can proceed in one flow without manual page reload.
- Alternative considered: Ask user to click Retry manually. Rejected due to friction.

## Risks / Trade-offs

- [Gateway config API mismatch] -> Mitigation: Define and validate a single contract for key write payload/response before UI release.
- [Leaking secret in logs or errors] -> Mitigation: Redact values in UI errors and keep key out of console output.
- [Invalid key still saves but model fetch fails] -> Mitigation: Save success and model fetch are reported separately with clear retry actions.
- [Concurrent config writes] -> Mitigation: Disable save button while request is in flight and surface conflict/retry messaging.

## Migration Plan

1. Add OpenRouter onboarding UI controls to model step.
2. Implement gateway config write call for OpenRouter key.
3. Add post-save model refresh and UX states.
4. Add tests for key save path and post-save model availability behavior.
5. Release behind normal onboarding path with no routing changes.

Rollback:
- Revert model step UI additions and config write call; fall back to existing model-only selection flow.
- Existing onboarding behavior remains intact because this change is additive.

## Open Questions

- Exact RPC/HTTP contract for writing OpenRouter key into `openclaw.json` (method name, payload shape, response schema).
- Whether gateway requires restart/reload after config write for model list to reflect new key.
- Whether to support optional key validation endpoint before save.
