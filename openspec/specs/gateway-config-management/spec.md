## ADDED Requirements

### Requirement: Configuration reads SHALL return a normalized typed model
The UI configuration layer SHALL transform `config.get` payloads into a normalized typed model with stable defaults for critical onboarding and settings fields.

#### Scenario: Load succeeds with full payload
- **WHEN** the gateway returns a valid `config.get` response with `payload.parsed`
- **THEN** the configuration layer returns a typed normalized model
- **AND** required fields used by UI flows are available through stable property paths

#### Scenario: Load succeeds with partial payload
- **WHEN** the gateway returns a valid `config.get` response with missing optional branches
- **THEN** the configuration layer applies defaults for required UI behavior
- **AND** no runtime exception is thrown for missing branches

### Requirement: Configuration updates SHALL be path-targeted and non-destructive
The UI configuration layer SHALL generate targeted patch updates for `config.set` so updates modify only intended paths and preserve unrelated configuration branches.

#### Scenario: Update nested model selection
- **WHEN** onboarding updates the selected model path
- **THEN** the generated update targets only the model-selection path
- **AND** unrelated sections (for example channels, hooks, skills) remain unchanged

#### Scenario: Update with absent parent branch
- **WHEN** an update targets a nested path whose parent object is missing
- **THEN** the configuration layer creates required parent nodes in the patch
- **AND** the resulting config remains valid for subsequent reads

### Requirement: `config.get` response SHALL be parsed for hash and used in subsequent writes
The `config.get` response payload contains a `hash` field. The UI configuration layer SHALL capture this value and forward it as `baseHash` in the `config.set` request to satisfy gateway optimistic concurrency validation.

#### Scenario: Hash round-trip on update
- **WHEN** `config.get` returns a response with a `hash` field in `payload`
- **THEN** the configuration layer stores the hash alongside the snapshot
- **AND** the subsequent `config.set` call includes `{ raw: "<serialized JSON>", baseHash: "<hash>" }`
- **AND** omitting `baseHash` causes the gateway to reject the request with "config base hash required"

#### Scenario: `config.set` request shape
- **WHEN** the configuration layer submits a write
- **THEN** the params are `{ raw: string, baseHash: string }` only
- **AND** no other top-level fields (`patch`, `config`, `hash`) are included

### Requirement: Configuration write flow SHALL provide read-after-write consistency
After a successful `config.set`, the UI configuration layer SHALL provide refreshed normalized state for dependent UI screens.

#### Scenario: Successful write refreshes state
- **WHEN** `config.set` succeeds
- **THEN** the configuration layer refreshes or rehydrates normalized config state
- **AND** subsequent UI reads reflect the new value without manual page reload

#### Scenario: Failed write preserves prior state
- **WHEN** `config.set` fails
- **THEN** the configuration layer preserves the previous normalized state
- **AND** returns an actionable error for the caller flow
