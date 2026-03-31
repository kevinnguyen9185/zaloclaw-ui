## ADDED Requirements

### Requirement: Provider catalog SHALL be prepopulated with five supported providers
The onboarding model selection flow SHALL present a predefined provider list containing exactly openai, google, anthropic, openrouter, and litellm.

#### Scenario: Provider list is rendered
- **WHEN** the model selection step is displayed
- **THEN** the provider options include openai, google, anthropic, openrouter, and litellm
- **AND** no additional provider option is shown in this flow

### Requirement: Provider-specific credential inputs SHALL be collected before testing
The model onboarding flow SHALL collect provider-specific credentials required for authentication and configuration.

#### Scenario: Standard provider credentials collection (openai, google, anthropic, openrouter)
- **WHEN** the user selects a standard provider
- **THEN** the UI displays an API key input field
- **AND** defaults for `auth` and `api` are assumed for that provider
- **AND** the Test button is only enabled when API key is provided

#### Scenario: LiteLLM provider credentials collection
- **WHEN** the user selects litellm
- **THEN** the UI displays both API key and baseUrl input fields
- **AND** baseUrl represents the LiteLLM service endpoint (e.g., "http://host.docker.internal:4000")
- **AND** the Test button is only enabled when both API key and baseUrl are provided

### Requirement: Model test SHALL validate provider credentials before persistence
The model onboarding flow SHALL execute a provider-specific model connectivity and authorization test using the selected provider and submitted API key before allowing configuration persistence.

#### Scenario: Test succeeds for selected provider
- **WHEN** the user selects a provider, enters a valid API key, and triggers Test
- **THEN** the system returns a successful validation result for that provider
- **AND** the flow marks the model configuration as eligible for save
- **AND** save persists that tested API key using `config.get` and `config.set` at `models.providers.{provider_name}.apiKey`
- **AND** save updates `agents.defaults.model.primary` to the tested provider/model reference
- **AND** save adds the tested model to `models.providers.{provider_name}.models` when missing
- **AND** save adds the tested provider/model reference to `agents.defaults.models` when missing

#### Scenario: Test fails for selected provider
- **WHEN** the user triggers Test with invalid or unauthorized credentials
- **THEN** the system returns a failed validation result
- **AND** the flow remains in a non-savable state until a subsequent successful test

### Requirement: Test status SHALL be explicit to the user
The onboarding flow SHALL display clear test status feedback for in-progress, success, and failure states.

#### Scenario: In-progress test feedback
- **WHEN** a provider test request is running
- **THEN** the UI indicates that validation is in progress
- **AND** repeat test submissions are prevented until completion

#### Scenario: Failed test feedback
- **WHEN** the test request fails
- **THEN** the UI displays an actionable failure message
- **AND** the message identifies that the model cannot be saved yet
