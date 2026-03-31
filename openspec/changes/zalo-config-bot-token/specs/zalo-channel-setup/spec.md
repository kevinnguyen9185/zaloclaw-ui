## ADDED Requirements

### Requirement: Zalo configuration flow SHALL require bot token for incomplete setup
The Zalo configuration screen MUST require bot token input when Zalo is not configured or not paired, and MUST block continuation until a valid token value is provided.

#### Scenario: Prompt token when unconfigured
- **WHEN** the user opens Zalo configuration and the channel is not configured
- **THEN** the UI shows a required bot token input
- **AND** submission is blocked until token input is present

#### Scenario: Prompt token when unpaired
- **WHEN** the user opens Zalo configuration and the channel is configured but not paired
- **THEN** the UI shows a required bot token input
- **AND** submission is blocked until token input is present

#### Scenario: Do not force token re-entry when ready
- **WHEN** the user opens Zalo configuration and the channel is configured and paired
- **THEN** the UI does not require token re-entry for unchanged settings
- **AND** the user can continue without token validation errors

### Requirement: Zalo configuration submission SHALL persist to channels.zalo
When Zalo configuration is submitted, the client MUST persist Zalo settings by issuing `config.set` with updates targeted to `channels.zalo`.

#### Scenario: Persist token to Zalo channel path
- **WHEN** the user submits valid Zalo configuration including bot token
- **THEN** the config write targets the `channels.zalo` branch
- **AND** unrelated config branches are not modified by this write

#### Scenario: Reflect latest state after write
- **WHEN** a `channels.zalo` write succeeds
- **THEN** the UI refreshes normalized config state
- **AND** the Zalo configuration screen reflects the updated configured/paired status