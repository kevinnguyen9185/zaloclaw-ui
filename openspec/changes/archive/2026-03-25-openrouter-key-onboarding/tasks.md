## 1. Model Step UI Enhancements

- [x] 1.1 Add OpenRouter setup panel in onboarding model step with "Create OpenRouter account" action
- [x] 1.2 Add "I already have a key" toggle and masked API key input field
- [x] 1.3 Add client-side validation for non-empty API key before save
- [x] 1.4 Add loading, success, and error states for key save workflow
- [x] 1.5 Ensure sensitive key values are redacted in all user-facing messages

## 2. Gateway Config Persistence

- [x] 2.1 Define and implement gateway config write call to persist OpenRouter key into `openclaw.json`
- [x] 2.2 Wire model step save action to call the config write endpoint/method
- [x] 2.3 Disable duplicate save submissions while request is in-flight
- [x] 2.4 Handle write failures with retry-friendly, non-destructive UX

## 3. Model Availability Flow

- [x] 3.1 Trigger `models.list` reload after successful key save
- [x] 3.2 Keep standard model selection path functional when models are already available
- [x] 3.3 Allow advancing to next onboarding step after successful model selection in the same view

## 4. Testing and Verification

- [x] 4.1 Add/extend unit tests for key input validation and redaction behavior
- [x] 4.2 Add integration test for successful key persistence and model refresh path
- [x] 4.3 Add integration test for key save failure and retry behavior
- [x] 4.4 Run `npm test` and `npm run build` to verify no regressions
