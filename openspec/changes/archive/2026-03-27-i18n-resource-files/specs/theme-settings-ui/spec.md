## ADDED Requirements

### Requirement: Settings copy SHALL be localization-driven
Settings panel labels, descriptions, and helper copy MUST be rendered from locale resources.

#### Scenario: Localized settings labels
- **WHEN** user opens settings
- **THEN** section titles and descriptions use translation keys
- **AND** locale switching updates settings copy without page errors

### Requirement: Language preference controls SHALL be available in settings
Settings MUST provide controls to view and change the current language preference.

#### Scenario: Language preference update
- **WHEN** user selects a different language in settings
- **THEN** the app updates locale immediately
- **AND** persists the preference for future visits
