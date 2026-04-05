## 1. Dashboard Use-Case Simplification

- [x] 1.1 Identify current dashboard use-case launch components/routes and remove or hide multi-use-case chooser behavior.
- [x] 1.2 Implement a single friendly-assistant entry experience in the dashboard use-case section.
- [x] 1.3 Ensure the simplified single-path flow preserves extension points for future multi-use-case expansion.

## 2. Assistant Intent Profile Input

- [x] 2.1 Implement guided assistant identity onboarding flow that starts after user chooses to start with assistant.
- [x] 2.2 Render required guided prompts for assistant name, creature type, vibe, emoji, user name, and timezone.
- [x] 2.3 Add optional starter identity suggestion path with accept/edit behavior.

## 3. Identity Persistence and Artifact Generation

- [x] 3.1 Add or adapt state/config storage to persist structured assistant identity answers.
- [x] 3.2 Implement validation for required identity fields and clear blocking errors on incomplete finalize attempts.
- [x] 3.3 Generate and persist `AGENT.md`, `SOUL.md`, and `USER.md` from finalized identity answers.
- [x] 3.4 Implement regenerate-on-update behavior so identity files stay in sync with edited profile values.
- [x] 3.5 Add tests for persistence, restore, and artifact generation consistency.

## 4. Localization and Quality

- [x] 4.1 Add or update localization keys for single-use-case and guided identity onboarding copy in all supported locales.
- [x] 4.2 Update dashboard UI tests to assert single-use-case rendering and start-to-onboarding transition behavior.
- [x] 4.3 Run lint and relevant test suites, then verify no regressions in dashboard-shell behavior.
