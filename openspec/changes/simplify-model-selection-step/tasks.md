## 1. Model Option Loading

- [x] 1.1 Update onboarding model-step state loading to combine the persisted primary model with discovered model options for the dropdown
- [x] 1.2 Add or update helpers so the current primary model remains selectable even when it is absent from the latest discovered model list
- [x] 1.3 Add or update tests for selectable-model loading, fallback inclusion, and empty-state detection

## 2. Onboarding UI Simplification

- [x] 2.1 Replace the provider and model text inputs plus read-only primary-model field with a single primary-model dropdown
- [x] 2.2 Update the model step to show clear loading, empty, save-success, and save-failure messaging for the dropdown workflow
- [x] 2.3 Update localization strings and component tests to match the new guided primary-model selection flow

## 3. Primary Model Persistence

- [x] 3.1 Simplify the save action to persist only the selected primary-model reference through the config service
- [x] 3.2 Ensure the config write remains path-targeted and preserves unrelated provider and application configuration branches
- [x] 3.3 Add or update tests for successful primary-model save, missing parent branch creation, read-after-write refresh, and failed-save behavior