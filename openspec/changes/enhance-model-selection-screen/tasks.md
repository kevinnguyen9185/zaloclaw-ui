## 1. Config Loading and Selection State

- [x] 1.1 Load the current OpenClaw config through `config.get` before rendering save behavior
- [x] 1.2 Derive the active provider and model from `agents.defaults.model.primary`
- [x] 1.3 Preserve the fixed provider catalog (openai, google, anthropic, openrouter, litellm) in the onboarding UI
- [x] 1.4 Keep API key and model validation states explicit before enabling Test

## 2. Provider Test Flow

- [x] 2.1 Keep a provider-aware test adapter interface with a normalized success/failure contract
- [x] 2.2 Support provider-specific test handlers for openai, google, anthropic, openrouter, and litellm
- [x] 2.3 Wire the Test action to the selected provider, model, and API key
- [x] 2.4 Invalidate prior successful test state when provider, model, or key input changes

## 3. Config Reconciliation on Save

- [x] 3.1 Enforce save gating so persistence is allowed only after the latest successful test for the current provider/model/key
- [x] 3.2 Use `config.get` to load the latest config snapshot before applying any save mutations
- [x] 3.3 Update `models.providers.{provider_name}.apiKey` with the validated API key
- [x] 3.4 Ensure `models.providers.{provider_name}` exists when saving a newly tested provider
- [x] 3.5 If the tested model is missing from `models.providers.{provider_name}.models`, append it without removing existing models
- [x] 3.6 Update `agents.defaults.model.primary` to the tested primary model reference
- [x] 3.7 If the tested primary model reference is missing from `agents.defaults.models`, add it without removing existing entries
- [x] 3.8 Persist the reconciled config through `config.set` while preserving unrelated provider and model settings

## 4. Validation and Regression Coverage

- [x] 4.1 Add or update unit tests for provider list rendering and input validation preconditions
- [x] 4.2 Add or update tests for test-success, test-failure, and save-gating transitions
- [x] 4.3 Add or update tests for provider API key persistence through the `config.get`/`config.set` flow
- [x] 4.4 Add or update tests for conditional insertion into `models.providers.{provider_name}.models`
- [x] 4.5 Add or update tests for conditional insertion into `agents.defaults.models`
- [x] 4.6 Run the project test suite and verify onboarding flow works for all five providers
