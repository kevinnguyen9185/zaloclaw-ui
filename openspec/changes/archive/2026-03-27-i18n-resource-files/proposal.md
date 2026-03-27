## Why

The UI is currently single-language and hard-coded in English, which limits usability for Vietnamese-first users. We need a structured localization system now so copy can be translated consistently and scaled to more languages without rewriting components.

## What Changes

- Add an app-wide localization capability with Vietnamese as the default language.
- Introduce resource-based translation files organized by language and namespace.
- Add a lightweight i18n runtime (provider + translation helper) for client and app-shell usage.
- Migrate visible dashboard, onboarding, and settings copy from hard-coded strings to translation keys.
- Add a language preference flow (default `vi`, user override persisted locally).
- Define fallback behavior when a translation key is missing.

## Capabilities

### New Capabilities
- `app-localization`: Localization architecture, language resources, default language behavior, fallback handling, and translation key usage.

### Modified Capabilities
- `dashboard-shell`: Dashboard and shell labels become localization-driven instead of hard-coded.
- `onboarding-wizard`: Onboarding step headings, guidance, and actions become localization-driven.
- `theme-settings-ui`: Settings-facing labels and descriptions become localization-driven.

## Impact

- `src/lib/` localization runtime modules (types, provider/context, translation helper, storage)
- `src/app/` layout/provider wiring for localization defaults
- `src/components/dashboard/*`, `src/components/onboarding/*`, `src/app/(app)/settings/*` copy migration to translation keys
- New language resource files (for example `src/locales/vi/*.json`, `src/locales/en/*.json`)
- No gateway protocol or backend API contract changes