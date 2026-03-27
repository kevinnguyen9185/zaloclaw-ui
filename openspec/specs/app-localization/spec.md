## ADDED Requirements

### Requirement: Application SHALL support resource-file localization
The application SHALL load UI strings from locale resource files organized by language and namespace.

#### Scenario: Resource files resolve by locale and namespace
- **WHEN** the app needs a localized string
- **THEN** it resolves the key from a locale resource namespace
- **AND** no hard-coded UI copy is required for migrated surfaces

### Requirement: Default locale SHALL be Vietnamese
The application MUST default to Vietnamese for first-time users.

#### Scenario: First launch locale resolution
- **WHEN** a user has no previously saved language preference
- **THEN** the locale is set to `vi`
- **AND** UI text renders from Vietnamese resources

### Requirement: Locale preference SHALL be persisted client-side
The application MUST persist the selected locale for subsequent visits.

#### Scenario: User selects a language
- **WHEN** user changes language from locale controls
- **THEN** the selected locale is saved in client storage
- **AND** the app uses that locale on the next visit

### Requirement: Translation lookup SHALL have deterministic fallback
Translation resolution MUST use fallback behavior when keys are missing.

#### Scenario: Missing key in selected locale
- **WHEN** a key does not exist in the selected locale resource
- **THEN** the app falls back to Vietnamese resources
- **AND** if still missing, displays the key identifier as final fallback
