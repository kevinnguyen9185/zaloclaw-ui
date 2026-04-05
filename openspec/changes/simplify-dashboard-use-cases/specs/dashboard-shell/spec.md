## ADDED Requirements

### Requirement: Dashboard use-case entry SHALL be single-path for first release
The dashboard SHALL expose one default use-case entry for first release, representing a friendly user assistant flow, and MUST NOT present a multi-card use-case chooser in the primary path.

#### Scenario: Single use-case shown in dashboard
- **WHEN** a user opens the dashboard use-case area
- **THEN** only the friendly-assistant use-case entry is shown
- **AND** additional first-release use-case options are not displayed

### Requirement: Single-path entry SHALL start guided assistant identity flow
The dashboard single-path assistant entry MUST launch the guided assistant identity onboarding flow when the user selects start.

#### Scenario: Start action opens identity onboarding
- **WHEN** the user selects the primary action to start with the assistant
- **THEN** the dashboard transitions to the guided identity onboarding process
- **AND** the user can complete identity questions before generating OpenClaw identity documents

## MODIFIED Requirements

### Requirement: Dashboard use-case launchpad copy SHALL be localization-driven
Use-case entry text MUST be translated through resource keys.

#### Scenario: Localized single use-case entry
- **WHEN** the dashboard use-case entry is displayed
- **THEN** title, description, and call-to-action text are resolved from locale resources
- **AND** fallback behavior applies for missing keys
