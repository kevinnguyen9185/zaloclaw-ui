## ADDED Requirements

### Requirement: Onboarding model step SHALL require provider selection from a fixed set
The onboarding wizard SHALL require users to choose exactly one provider from the fixed set of openai, google, anthropic, openrouter, and litellm before they can execute model testing.

#### Scenario: Provider is required before testing
- **WHEN** the user has not selected a provider
- **THEN** the Test action is blocked
- **AND** the wizard indicates that provider selection is required

### Requirement: Onboarding model step SHALL require provider-specific credential input before testing
The onboarding wizard SHALL collect and validate credential input according to provider type before Test can be submitted.

#### Scenario: Standard provider credentials (openai, google, anthropic, openrouter)
- **WHEN** the user has selected a standard provider
- **THEN** the wizard SHALL require only API key input
- **AND** `auth` and `api` MAY use defaults for that provider
- **AND** the Test action is blocked until API key is provided

#### Scenario: LiteLLM provider credentials
- **WHEN** the user has selected litellm
- **THEN** the wizard SHALL require both API key and baseUrl (service endpoint) input
- **AND** the Test action is blocked until both fields are provided
- **AND** the Test action is blocked if baseUrl is malformed or cannot be resolved

### Requirement: Save progression SHALL be gated by latest successful test
The onboarding wizard SHALL allow progression that persists primary model configuration only if the latest test result for the current provider and key is successful.

#### Scenario: Test success enables save progression
- **WHEN** the current provider/key combination has a successful test result
- **THEN** the wizard enables the save/continue action
- **AND** progression persists the selected model as primary configuration
- **AND** progression uses `config.get` then `config.set` to persist the same tested API key to `models.providers.{provider_name}.apiKey`
- **AND** progression updates `agents.defaults.model.primary` to the tested provider/model reference
- **AND** progression adds missing entries for the tested model under `models.providers.{provider_name}.models` and `agents.defaults.models`

#### Scenario: Input changed after successful test
- **WHEN** the user changes provider or API key after a successful test
- **THEN** the previous test result is invalidated for save gating
- **AND** the wizard requires re-testing before save progression
