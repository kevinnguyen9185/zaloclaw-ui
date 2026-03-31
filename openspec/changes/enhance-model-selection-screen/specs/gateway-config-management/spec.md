## ADDED Requirements

### Requirement: Provider configuration SHALL include provider-specific fields
Provider configuration under `models.providers.{provider_name}` SHALL include the minimal required fields for each provider type.

#### Scenario: Standard provider configuration (openai, google, anthropic, openrouter)
- **WHEN** persisting configuration for providers openai, google, anthropic, or openrouter
- **THEN** the system SHALL ensure `models.providers.{provider_name}` includes:
  - `apiKey`: The provider's API authentication credential
  - `auth`: The authentication method (typically "api-key" for standard providers)
  - `api`: The API compatibility mode (e.g., "openai-completions" for OpenAI-compatible APIs)
- **AND** other properties such as baseUrl are considered defaults for these providers and do not require explicit user input

#### Scenario: LiteLLM provider configuration
- **WHEN** persisting configuration for provider litellm
- **THEN** the system SHALL ensure `models.providers.litellm` includes:
  - `baseUrl`: The LiteLLM service endpoint URL (required for LiteLLM, e.g., "http://host.docker.internal:4000")
  - `apiKey`: The LiteLLM access credential
  - `auth`: The authentication method (typically "api-key" for LiteLLM)
  - `api`: The API compatibility mode (e.g., "openai-completions" for LiteLLM's OpenAI-compatible interface)

### Requirement: Primary model persistence SHALL require successful validation evidence
The configuration management flow SHALL persist primary model settings only when provided evidence that the current provider and credentials passed model testing in the same onboarding session.

#### Scenario: Validated persistence request
- **WHEN** onboarding submits a persistence request with successful validation evidence
- **THEN** configuration write proceeds after loading the latest config with `config.get`
- **AND** the persisted state represents the tested provider and model selection
- **AND** provider API key write proceeds via `config.set` at `models.providers.{provider_name}.apiKey`
- **AND** `agents.defaults.model.primary` is updated to the tested provider/model reference

#### Scenario: Unvalidated persistence request
- **WHEN** onboarding submits a persistence request without successful validation evidence
- **THEN** configuration write for primary model is rejected
- **AND** configuration write for `models.providers.{provider_name}.apiKey` is rejected
- **AND** the caller receives an actionable error indicating test is required

### Requirement: Primary model reference SHALL be stored in `agents.defaults.model.primary`
Primary model persistence SHALL store the active model as a provider/model reference in `agents.defaults.model.primary` so downstream features can resolve the active model from a single field.

#### Scenario: Persist tested primary model reference
- **WHEN** validated onboarding persistence succeeds
- **THEN** stored configuration updates `agents.defaults.model.primary` with the tested provider/model reference
- **AND** subsequent configuration reads can derive provider and model identity from that primary reference

### Requirement: Provider API key SHALL be stored in provider-scoped path
Validated onboarding persistence SHALL store the tested API key in OpenClaw configuration under the selected provider path `models.providers.{provider_name}.apiKey`.

#### Scenario: Persist tested API key to provider path
- **WHEN** validated onboarding persistence succeeds for provider `{provider_name}`
- **THEN** the system reads current config with `config.get` and updates `models.providers.{provider_name}.apiKey` using `config.set`
- **AND** existing API keys for other providers remain unchanged

### Requirement: Provider model registry SHALL include newly validated models
Validated onboarding persistence SHALL ensure the tested model exists in `models.providers.{provider_name}.models` after save.

#### Scenario: Missing model is appended to provider registry
- **WHEN** validated onboarding persistence succeeds and the tested model is not present in `models.providers.{provider_name}.models`
- **THEN** the system appends a new entry for that model to `models.providers.{provider_name}.models`
- **AND** existing model entries for that provider remain unchanged

#### Scenario: Existing provider model is preserved
- **WHEN** validated onboarding persistence succeeds and the tested model already exists in `models.providers.{provider_name}.models`
- **THEN** the system does not create a duplicate model entry

### Requirement: Agent default model registry SHALL include newly selected primary models
Validated onboarding persistence SHALL ensure the tested primary model reference exists in `agents.defaults.models` after save.

#### Scenario: Missing primary model reference is added to defaults registry
- **WHEN** validated onboarding persistence succeeds and the tested provider/model reference is not present in `agents.defaults.models`
- **THEN** the system adds that reference to `agents.defaults.models`
- **AND** existing default model entries remain unchanged
