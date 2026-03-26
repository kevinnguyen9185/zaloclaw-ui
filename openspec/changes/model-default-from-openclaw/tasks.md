## 1. Config and Model Data Integration

- [x] 1.1 Extend onboarding model step data load to read OpenClaw config default-model value
- [x] 1.2 Define normalization logic for configured default identifier and models.list model IDs
- [x] 1.3 Handle config fetch errors with non-blocking fallback to manual model selection

## 2. Default Selection Behavior

- [x] 2.1 Preselect dropdown value when configured default model exists in fetched models
- [x] 2.2 Preserve current manual selection behavior when no default is configured
- [x] 2.3 Preserve current manual selection behavior when configured default does not exist in fetched models
- [x] 2.4 Ensure user override remains authoritative after manual model change

## 3. UX and Continuation Flow

- [x] 3.1 Add helper text indicating when selection came from OpenClaw default configuration
- [x] 3.2 Keep existing retry and next actions intact with default preselection enabled
- [x] 3.3 Verify save and step transition still use selected dropdown value

## 4. Testing and Verification

- [x] 4.1 Add or update tests for default present and matching model scenario
- [x] 4.2 Add or update tests for default present but non-matching model scenario
- [x] 4.3 Add or update tests for config fetch failure fallback scenario
- [x] 4.4 Run npm test and npm run build to validate no regressions
