## Why

The current model setup flow does not fully reconcile the actual OpenClaw config structure after a successful provider test. Users need a provider-guided onboarding flow that validates credentials first, then updates the live model registry and default model references in a way that matches the real `openclaw.json` layout.

## What Changes

- Add a provider-first model selection UI that prepopulates exactly five provider options: openai, google, anthropic, openrouter, and litellm.
- Require users to choose one provider and enter an API key before testing.
- For standard providers (openai, google, anthropic, openrouter), only `apiKey` is required as user input; `auth` and `api` use defaults.
- For litellm, require users to provide both `apiKey` and `baseUrl` (the LiteLLM service endpoint) since remote service routing must be explicitly specified.
- Add a Test action that performs a live model connectivity/authorization check for the selected provider and key.
- Retrieve the current OpenClaw configuration using `config.get` and load the active primary model from `agents.defaults.model.primary`.
- Save the tested model/provider as the primary model in OpenClaw configuration only after a successful test.
- After successful test, update provider-scoped config under `models.providers.{provider_name}`, including the validated API key (and baseUrl for litellm).
- If the tested model does not exist in `models.providers.{provider_name}.models`, add it to that provider model registry.
- If the tested primary model reference does not exist in `agents.defaults.models`, add it to that default model registry.
- Persist the reconciled config back through `config.set` without overwriting unrelated provider or model entries.
- Surface clear success and failure feedback so users understand whether configuration was persisted.

## Capabilities

### New Capabilities
- `multi-provider-model-onboarding`: Guided selection and validation flow for openai, google, anthropic, openrouter, and litellm before saving a primary model.

### Modified Capabilities
- `onboarding-wizard`: Extend onboarding requirements to include provider prepopulation, test gating, and post-test persistence behavior.
- `gateway-config-management`: Update configuration requirements so primary model persistence is conditioned on successful provider test results.

## Impact

- Affected UI routes/components in onboarding model step and related form controls.
- Affected validation and test APIs/services for provider-specific credential checks.
- Affected OpenClaw configuration read/write path using `config.get` and `config.set` for provider-scoped API key persistence, provider model registry updates, and default model registry updates.
- No breaking API changes expected for external consumers.
