## ADDED Requirements

### Requirement: Model step merges OpenClaw sessions default model into model list
The onboarding model step SHALL fetch `sessions.list` (with `includeGlobal: true`) in parallel with `models.list` and, if the sessions-reported default model (`payload.defaults.model`) is not already present in the fetched model list, prepend a synthetic entry for it so it is selectable in the dropdown.

#### Scenario: Sessions default model absent from model list is merged in
- **WHEN** `sessions.list` returns a `payload.defaults.model` value
- **AND** that model ID is not present (case/whitespace insensitive) in the `models.list` response
- **THEN** the model step SHALL prepend a synthetic model entry for it at the top of the dropdown

#### Scenario: Sessions default model already in model list is not duplicated
- **WHEN** `sessions.list` returns a `payload.defaults.model` value
- **AND** that model ID is already present (case/whitespace insensitive) in the `models.list` response
- **THEN** the model step SHALL NOT add a duplicate entry for it

#### Scenario: Sessions list fetch fails without blocking model step
- **WHEN** `sessions.list` call throws or returns a non-ok response
- **THEN** the model step SHALL continue loading with the original `models.list` result
- **AND** no error is exposed to the user for the sessions fetch failure

#### Scenario: Sessions list returns no defaults block
- **WHEN** `sessions.list` response payload contains no `defaults` property
- **OR** `payload.defaults.model` is absent or empty
- **THEN** no synthetic model entry is added to the list
