## Context

The onboarding model step currently centers on a narrower setup path and does not enforce a provider-first test-before-save workflow. This change spans onboarding UI, provider test handling, and OpenClaw configuration persistence, and therefore benefits from explicit design decisions to keep behavior consistent across providers.

Constraints:
- Supported providers in this flow are fixed to five: openai, google, anthropic, openrouter, litellm.
- Primary model persistence must happen only after successful provider test.
- Persistence must read the current config using `config.get`, derive the active model from `agents.defaults.model.primary`, and write changes back with `config.set`.
- Successful save must reconcile the real config branches used by OpenClaw: `models.providers`, `models.providers.{provider_name}.models`, `agents.defaults.model.primary`, and `agents.defaults.models`.
- Existing onboarding and configuration capabilities should be extended rather than replaced.

## Goals / Non-Goals

**Goals:**
- Present a deterministic provider list with exactly five prepopulated options.
- Collect provider choice and API key in a single guided flow.
- Gate persistence on explicit Test success.
- Persist selected provider/model as OpenClaw primary model after success.
- Ensure newly validated provider/model selections are discoverable in both provider-scoped and agent-default model registries.
- Provide clear state and error UX around Test and Save transitions.

**Non-Goals:**
- Supporting custom provider creation in this change.
- Expanding beyond API-key-based authentication.
- Redesigning unrelated onboarding steps or dashboard behaviors.

## Decisions

1. Fixed provider catalog in onboarding model step
- Decision: Use a static provider registry for this screen containing openai, google, anthropic, openrouter, and litellm.
- Rationale: Keeps UX predictable and reduces configuration errors in first-run onboarding.
- Alternative considered: Dynamically load providers from backend/config.
- Why not now: Adds complexity and risk to onboarding reliability; can be added later as extension.

2. Two-phase commit flow: Test then persist
- Decision: Split user action into (a) Test credentials/model, then (b) Save as primary model only on success.
- Rationale: Prevents invalid credentials from being written into OpenClaw config.
- Alternative considered: Save first, validate later.
- Why not now: Creates invalid config states and harder recovery.

3. Provider-specific test adapter under unified contract
- Decision: Route Test through a provider-aware service interface that normalizes success/failure responses.
- Rationale: Keeps UI logic simple and consistent while enabling provider-specific API details under the hood.
- Alternative considered: Put provider conditionals directly in UI action handlers.
- Why not now: Would duplicate logic and increase maintenance risk.

4. Config source of truth comes from `agents.defaults.model.primary`
- Decision: Treat `agents.defaults.model.primary` as the persisted source of truth for the active model, instead of relying on redundant `provider` or `id` fields.
- Rationale: The live config structure already uses `primary` as the authoritative reference, and this avoids drift between duplicated fields.
- Alternative considered: Continue writing `agents.defaults.model.provider` and `agents.defaults.model.id`.
- Why not now: Redundant fields are easier to desynchronize and are not required for the requested persistence behavior.

5. Successful save reconciles both provider and default model registries
- Decision: After successful validation, update `models.providers.{provider_name}.apiKey`, ensure `models.providers.{provider_name}` exists, append the tested model to `models.providers.{provider_name}.models` if missing, set `agents.defaults.model.primary`, and add the primary reference to `agents.defaults.models` if missing.
- Rationale: This matches the real config shape and ensures the tested model is both selectable under its provider and available in agent defaults.
- Alternative considered: Only save the API key and primary reference.
- Why not now: Leaves config partially updated and can make newly added models invisible in provider/default registries.

6. New model entries use additive merge behavior
- Decision: Preserve existing provider branches and model metadata, only adding missing provider/model entries when absent.
- Rationale: Prevents accidental loss of existing models, aliases, base URLs, or provider-specific settings.
- Alternative considered: Replace the full provider block or full default-model map on each save.
- Why not now: Full replacement is high risk and can erase unrelated configuration.

7. Provider-specific configuration field requirements
- Decision: For standard providers (openai, google, anthropic, openrouter), require only `apiKey`, `auth`, and `api` fields. For litellm, additionally require `baseUrl` to specify the service endpoint.
- Rationale: Standard providers have consistent authentication and API compatibility modes, while litellm requires explicit service routing to a local/remote endpoint.
- Alternative considered: Allow flexible field requirements per provider or auto-generate baseUrl for litellm.
- Why not now: Explicit requirement prevents configuration errors and matches the actual OpenClaw config expectations.

## Risks / Trade-offs

- [Provider API drift] -> Mitigation: Encapsulate provider calls behind adapter boundaries and centralize mapping.
- [Higher onboarding latency from live Test] -> Mitigation: Show progress/loading states and timeout-aware error messages.
- [User confusion between Test and Save] -> Mitigation: Disable Save until Test passes and show explicit status badge/message.
- [Credential handling risk] -> Mitigation: Avoid logging raw keys and use existing secure config handling patterns.
- [Registry merge inconsistency] -> Mitigation: Normalize provider/model keys and only append missing entries after checking existing collections.

## Migration Plan

1. Add/extend onboarding model step UI to render fixed provider options and key input.
2. Implement provider-aware test action and normalized response contract.
3. Gate persistence action on latest successful test result for selected provider/model.
4. Extend OpenClaw config read/write path to load with `config.get`, update `agents.defaults.model.primary`, reconcile `models.providers.{provider_name}` and `models.providers.{provider_name}.models`, and add missing entries in `agents.defaults.models`.
5. Verify onboarding flow in manual and automated tests for all five providers.

Rollback strategy:
- Revert to previous onboarding model step behavior and disable new test-gated save path if severe regressions occur.

## Open Questions

- What minimal model object should be inserted into `models.providers.{provider_name}.models` when a validated model is not already present?
- What default metadata should be written for a new `agents.defaults.models[primaryRef]` entry when the model has no prior alias or display settings?
- Should failed test errors be shown verbatim from provider APIs or mapped to user-friendly categories only?
