## Why

The model step currently lists available models but does not proactively honor OpenClaw default model configuration. Showing the configured default model in the dropdown improves first-run usability and reduces accidental model mismatch.

## What Changes

- Extend onboarding model step to fetch OpenClaw config and detect whether a default model is configured.
- Preselect and visually expose the default model in the model dropdown when that model exists in the fetched model list.
- Keep existing manual selection behavior and model save flow unchanged when no default model is configured or when the configured default is unavailable.
- Add validation and tests for matching, non-matching, and missing default-model scenarios.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- onboarding-wizard: Update step 2 requirements so model selection reads default model information from OpenClaw and preselects it when available.

## Impact

- Affected UI: onboarding model step behavior and dropdown default selection state.
- Affected integration: model step will read gateway config endpoint in addition to models list.
- Affected tests: onboarding model step tests and integration checks for default-model preselection cases.
