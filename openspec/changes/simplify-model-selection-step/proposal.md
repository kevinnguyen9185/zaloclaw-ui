## Why

The onboarding model step currently asks users to type both provider and model identifiers even though the app already knows the configured model catalog and current primary model. This creates avoidable friction and increases the chance of invalid manual entries for a choice that should be a guided selection.

## What Changes

- Remove the freeform provider and model text inputs from the onboarding model step.
- Replace the current read-only primary model field with a selectable dropdown populated from available configured models.
- Preselect the currently saved primary model in that dropdown when onboarding loads.
- Allow users to choose a different model from the dropdown and save it as the new primary model.
- Keep persistence focused on updating primary model selection without requiring users to re-enter provider details manually.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `onboarding-wizard`: Change the model step from manual provider/model entry to guided primary-model selection.
- `gateway-config-management`: Ensure primary model updates can be saved from a dropdown-driven selection flow without destructive config changes.

## Impact

- Affected onboarding model-step UI, state loading, validation, and save actions.
- Affected gateway config read/write helpers that derive selectable models and persist the chosen primary model.
- Affected onboarding localization copy for model-step labels, hints, and success messaging.