## Why

In onboarding step 2, users can only pick from models already configured in the gateway, but many first-time users do not have an OpenRouter account or API key yet. Adding a guided OpenRouter path in the model step reduces setup friction and makes first-run completion more likely.

## What Changes

- Add an OpenRouter onboarding path in the model selection step with a direct link to OpenRouter registration.
- Add a key input flow for users who already have an OpenRouter API key.
- Persist the entered OpenRouter key into gateway configuration (`openclaw.json`) via a controlled UI action.
- Keep existing model listing/selection behavior available after key setup.
- Show clear success and error states when saving configuration.

## Capabilities

### New Capabilities
- `openrouter-model-onboarding`: Guided OpenRouter registration and API key capture in the onboarding model step, including save-to-config behavior.

### Modified Capabilities
- `onboarding-wizard`: Extend step 2 behavior to support OpenRouter account creation guidance and API key persistence before model selection when needed.

## Impact

- Affected UI: onboarding model step page and related components.
- Affected gateway integration: config write path to update `openclaw.json` safely.
- Affected validation: onboarding and integration tests for key entry and persistence flow.
- No server-side secret storage in the app; persistence is delegated to gateway-side config handling.
