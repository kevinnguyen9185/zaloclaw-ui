## ADDED Requirements

### Requirement: Model step includes OpenRouter key path before model selection
The onboarding wizard SHALL allow OpenRouter key setup within step 2 and keep model selection available in the same step.

#### Scenario: User proceeds after configuring key
- **WHEN** user saves an OpenRouter key in step 2 and models are available
- **THEN** user can select a model and click next in the same step
- **AND** wizard advances to step 3 without requiring a page reload

#### Scenario: User skips key setup when models already available
- **WHEN** models are already available at step 2
- **THEN** user can continue with normal model selection
- **AND** OpenRouter key setup remains optional

### Requirement: Sensitive key value is not exposed in onboarding UI feedback
The onboarding wizard SHALL avoid exposing full OpenRouter key content in visible success/error messages.

#### Scenario: Save success message redacts key
- **WHEN** key save succeeds
- **THEN** success feedback contains no full API key value
- **AND** key is not rendered in plain text confirmation

#### Scenario: Save error message redacts key
- **WHEN** key save fails
- **THEN** error feedback contains no full API key value
- **AND** user can correct and retry input
