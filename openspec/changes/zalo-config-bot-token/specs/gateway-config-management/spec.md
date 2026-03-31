## MODIFIED Requirements

### Requirement: Configuration updates SHALL be path-targeted and non-destructive
The UI configuration layer SHALL generate targeted patch updates for `config.set` so updates modify only intended paths and preserve unrelated configuration branches.

#### Scenario: Update nested model selection
- **WHEN** onboarding updates the selected model path
- **THEN** the generated update targets only the model-selection path
- **AND** unrelated sections (for example channels, hooks, skills) remain unchanged

#### Scenario: Update Zalo channel configuration
- **WHEN** Zalo configuration updates bot token or related channel fields
- **THEN** the generated update targets only the `channels.zalo` path
- **AND** unrelated channel entries and non-channel sections remain unchanged

#### Scenario: Update with absent parent branch
- **WHEN** an update targets a nested path whose parent object is missing
- **THEN** the configuration layer creates required parent nodes in the patch
- **AND** the resulting config remains valid for subsequent reads