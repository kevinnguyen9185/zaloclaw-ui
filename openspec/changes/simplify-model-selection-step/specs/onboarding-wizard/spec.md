## ADDED Requirements

### Requirement: Onboarding model step SHALL use guided primary-model selection
The onboarding wizard SHALL replace manual provider and model text entry with a single dropdown for primary-model selection.

#### Scenario: Current primary model is preselected
- **WHEN** the model step loads and a primary model is already stored in configuration
- **THEN** the dropdown shows that primary model as the selected value
- **AND** the user is not required to type provider or model identifiers manually

#### Scenario: Current primary model is preserved as a selectable option
- **WHEN** the stored primary model is not present in the latest discovered model list
- **THEN** the wizard still includes that primary model in the dropdown
- **AND** the user can keep or change the selection without losing visibility of the current saved value

### Requirement: Onboarding model step SHALL present actionable model-selection states
The onboarding wizard SHALL make the model-selection state explicit for loading, empty, selectable, and saved conditions.

#### Scenario: Selectable models are available
- **WHEN** the wizard has one or more selectable models
- **THEN** it enables the dropdown and save action for a valid selection
- **AND** it communicates that the chosen value will become the active primary model

#### Scenario: No selectable models are available
- **WHEN** the wizard cannot derive any selectable models for the dropdown
- **THEN** it shows an explicit empty-state message
- **AND** it disables save until selectable models are available

### Requirement: Onboarding model step SHALL save the selected primary model
The onboarding wizard SHALL allow the user to choose another model from the dropdown and persist it as the active primary model.

#### Scenario: User saves a different primary model
- **WHEN** the user selects a different model from the dropdown and saves successfully
- **THEN** the wizard persists that model as the active primary model
- **AND** the step shows success feedback reflecting the saved selection

#### Scenario: Save fails
- **WHEN** persistence of the selected primary model fails
- **THEN** the wizard preserves the user's current dropdown selection
- **AND** it shows an actionable error message without implying that the primary model changed