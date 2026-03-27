## 1. Localization Foundation

- [x] 1.1 Create localization types and locale constants (`vi`, `en`) in `src/lib/i18n/`
- [x] 1.2 Implement translation lookup helper with fallback chain (`selected -> vi -> key`)
- [x] 1.3 Implement localization context/provider with current locale state and setter
- [x] 1.4 Add client-side locale persistence (load/save language preference)

## 2. Resource Files

- [x] 2.1 Create Vietnamese resource files by namespace (`common`, `dashboard`, `onboarding`, `settings`)
- [x] 2.2 Create English resource files by namespace mirroring Vietnamese key structure
- [x] 2.3 Add initial translation keys for dashboard shell and launchpad use cases
- [x] 2.4 Add initial translation keys for onboarding step pages and progress labels
- [x] 2.5 Add initial translation keys for settings labels and descriptions

## 3. App Wiring

- [x] 3.1 Wire LocalizationProvider into app layout with default locale `vi`
- [x] 3.2 Expose a reusable translation hook/helper for components
- [x] 3.3 Ensure provider/hook usage works across server/client boundaries where needed

## 4. UI Copy Migration

- [x] 4.1 Migrate dashboard shell copy to translation keys
- [x] 4.2 Migrate dashboard use-case launchpad copy (titles, outcomes, tags, effort, CTA)
- [x] 4.3 Migrate onboarding shell and step pages copy to translation keys
- [x] 4.4 Migrate settings page and theme settings panel copy to translation keys

## 5. Language Preference UX

- [x] 5.1 Add language selection control in settings
- [x] 5.2 Apply locale changes immediately after selection
- [x] 5.3 Persist selected language and restore it on next visit

## 6. Validation

- [x] 6.1 Validate default locale is Vietnamese for first-time users
- [x] 6.2 Validate fallback behavior for missing translation keys
- [x] 6.3 Validate keyboard/focus accessibility remains intact after i18n migration
- [x] 6.4 Run type-check/build and confirm no localization regressions