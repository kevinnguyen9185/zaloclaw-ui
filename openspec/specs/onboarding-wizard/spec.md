## ADDED Requirements

### Requirement: Onboarding model step SHALL use structured config service APIs
The onboarding model step SHALL read and update OpenClaw configuration exclusively through the shared structured configuration service.

#### Scenario: Model step load uses normalized state
- **WHEN** the onboarding model step initializes
- **THEN** it requests configuration via the structured configuration service
- **AND** it reads model/provider values from normalized typed state

#### Scenario: Model step save uses targeted patch
- **WHEN** the user confirms model/provider updates in onboarding
- **THEN** the step submits a targeted config patch through the configuration service
- **AND** no direct raw object mutation is performed in UI component code

### Requirement: Onboarding SHALL surface configuration errors with actionable context
The onboarding model step SHALL map configuration load/save failures into actionable user-visible feedback.

#### Scenario: Load failure on model step
- **WHEN** config loading fails during model step initialization
- **THEN** the user sees a retry-capable error state
- **AND** the step does not proceed with undefined configuration data

#### Scenario: Save failure on model update
- **WHEN** config save fails after user submission
- **THEN** the step remains on the current screen with clear failure feedback
- **AND** previous valid selections remain available for correction and retry
