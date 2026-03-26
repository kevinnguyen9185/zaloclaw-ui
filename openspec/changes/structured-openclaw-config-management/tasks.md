## 1. Config Domain Model

- [x] 1.1 Define TypeScript types for OpenClaw config branches used by onboarding and settings (models, agents defaults, gateway, channels, and related sections).
- [x] 1.2 Implement config normalization utilities that map `config.get` payloads into a stable typed model with defaults for missing branches.
- [x] 1.3 Add unit tests for normalization with full and partial config payload fixtures.

## 2. Config Service and Patch Updates

- [x] 2.1 Implement a dedicated config service module for websocket `config.get` and `config.set` interactions.
- [x] 2.2 Implement a path-targeted patch builder (set/unset/merge behavior) that preserves unrelated config branches.
- [x] 2.3 Add unit tests for nested path updates, absent parent creation, and non-destructive write behavior.
- [x] 2.4 Implement read-after-write refresh logic and error mapping in the config service.

## 3. Onboarding Integration

- [x] 3.1 Refactor onboarding model step to load configuration from the structured config service only.
- [x] 3.2 Refactor onboarding model/provider save flow to submit targeted config patches without direct raw object mutation.
- [x] 3.3 Implement retry-capable error state handling for config load and save failures in onboarding UI.
- [x] 3.4 Add or update tests covering onboarding model-step load/save behavior with config service integration.

## 4. Settings and Shared Call Site Migration

- [x] 4.1 Identify existing settings/config call sites using ad-hoc config mutation and migrate them to the config service.
- [x] 4.2 Remove or deprecate legacy raw config helper paths superseded by typed normalization and patch updates.
- [x] 4.3 Add regression tests for shared config consumers to validate no behavioral regressions after migration.

## 5. Validation and Documentation

- [x] 5.1 Add contract-style tests using realistic `config.get`/`config.set` payload samples to validate serialization compatibility.
- [x] 5.2 Document config service usage conventions for future onboarding/settings enhancements.
- [x] 5.3 Run project lint and tests, then resolve issues introduced by the migration.
