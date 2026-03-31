## ADDED Requirements

### Requirement: Primary-model selection updates SHALL preserve unrelated configuration
The UI configuration layer SHALL persist onboarding primary-model selection through a path-targeted update that changes only the active primary-model reference and preserves unrelated configuration branches.

#### Scenario: Save selected primary model
- **WHEN** onboarding submits a selected primary-model reference from the dropdown
- **THEN** the configuration layer updates `agents.defaults.model.primary`
- **AND** unrelated sections such as provider credentials, provider model registries, channels, hooks, and skills remain unchanged

#### Scenario: Missing model branch is created on save
- **WHEN** onboarding saves a selected primary-model reference and `agents.defaults.model` is missing
- **THEN** the configuration layer creates the required parent branch during the update
- **AND** the resulting configuration remains valid for subsequent reads

### Requirement: Primary-model selection writes SHALL return refreshed normalized state
After a successful onboarding primary-model update, the configuration layer SHALL return refreshed normalized state that reflects the persisted primary selection.

#### Scenario: Save success refreshes active primary model
- **WHEN** the selected primary-model reference is written successfully
- **THEN** the subsequent normalized config state exposes that saved value at `agents.defaults.model.primary`
- **AND** dependent onboarding UI reads reflect the saved selection without requiring a page reload