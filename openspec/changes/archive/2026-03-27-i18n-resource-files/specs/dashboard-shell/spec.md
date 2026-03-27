## ADDED Requirements

### Requirement: Dashboard shell text SHALL be localization-driven
Dashboard shell labels and helper text MUST be rendered from translation resources.

#### Scenario: Localized shell headings
- **WHEN** dashboard shell is rendered
- **THEN** page titles, subtitles, and section labels use translation keys
- **AND** switching locale updates rendered copy

### Requirement: Dashboard use-case launchpad copy SHALL be localization-driven
Use-case launchpad text MUST be translated through resource keys.

#### Scenario: Localized use-case cards
- **WHEN** launchpad cards are displayed
- **THEN** title, outcome, effort labels, and CTA text are resolved from locale resources
- **AND** fallback behavior applies for missing keys
