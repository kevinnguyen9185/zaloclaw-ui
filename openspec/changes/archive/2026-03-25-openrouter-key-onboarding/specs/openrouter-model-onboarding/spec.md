## ADDED Requirements

### Requirement: User can start OpenRouter setup from model step
The system SHALL provide an OpenRouter setup entry point in onboarding step 2 so users can create an account when they do not yet have an API key.

#### Scenario: Open registration link
- **WHEN** user is on onboarding step 2 and selects the OpenRouter registration action
- **THEN** system opens the OpenRouter website in a new browser tab
- **AND** onboarding step state in the current tab remains unchanged

### Requirement: User can enter an existing OpenRouter API key
The system SHALL provide an input flow in onboarding step 2 for users who already have an OpenRouter API key.

#### Scenario: Key input available
- **WHEN** user selects "I already have a key" in onboarding step 2
- **THEN** system displays an API key input control
- **AND** input is masked by default

#### Scenario: Save action requires non-empty key
- **WHEN** user attempts to save with an empty key value
- **THEN** system blocks submission
- **AND** shows a validation error message

### Requirement: OpenRouter key is persisted to gateway configuration
The system SHALL persist the submitted OpenRouter API key to gateway-managed configuration so it is stored in `openclaw.json`.

#### Scenario: Successful save
- **WHEN** user submits a valid key and gateway config write succeeds
- **THEN** system confirms save success to the user
- **AND** gateway-managed config contains the updated OpenRouter key

#### Scenario: Save failure
- **WHEN** user submits key and gateway config write fails
- **THEN** system shows a non-destructive error message
- **AND** user can retry save without leaving onboarding

### Requirement: Model list refreshes after key save
The system SHALL refresh available models after successful key persistence to let users continue onboarding immediately.

#### Scenario: Post-save refresh succeeds
- **WHEN** key save completes successfully
- **THEN** system requests model list again
- **AND** updated models are shown in the selector

#### Scenario: Post-save refresh fails
- **WHEN** key save succeeds but model list refresh fails
- **THEN** system keeps save success state visible
- **AND** prompts user to retry model fetch
