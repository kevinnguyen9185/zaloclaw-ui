## ADDED Requirements

### Requirement: Onboarding wizard copy SHALL be localization-driven
Onboarding step headers, guidance text, actions, and status labels MUST be rendered via translation keys.

#### Scenario: Localized onboarding steps
- **WHEN** onboarding renders any step
- **THEN** user-visible instructional text is sourced from locale resources
- **AND** locale switching updates all onboarding copy consistently

### Requirement: Onboarding progression labels SHALL remain understandable across locales
Progress and completion messaging MUST remain explicit in each supported locale.

#### Scenario: Progress indicator localization
- **WHEN** onboarding step indicator is shown
- **THEN** step labels and completion labels are translated
- **AND** progression meaning is preserved without relying on icons alone
