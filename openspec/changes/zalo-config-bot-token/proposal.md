## Why

The current Zalo configuration flow does not explicitly collect a bot token when Zalo is unconfigured or unpaired, which blocks successful setup and creates avoidable configuration errors. This change is needed now so the configuration screen can reliably guide first-time setup and write the required channel settings to the gateway config.

## What Changes

- Update the Zalo configuration screen to detect whether Zalo is configured/paired and require bot token input when setup is incomplete.
- Add clear validation and submission behavior so users cannot continue without a bot token in unconfigured/unpaired states.
- Persist Zalo channel configuration using `config.set` targeting the `channels.zalo` path.
- Keep updates path-targeted so unrelated configuration branches remain unchanged.

## Capabilities

### New Capabilities
- `zalo-channel-setup`: Guided Zalo setup behavior in configuration UI for missing pairing/token state and channel-specific write flow.

### Modified Capabilities
- `gateway-config-management`: Add/clarify requirement coverage for writing Zalo channel data to `channels.zalo` via targeted `config.set` updates.

## Impact

- Affected UI: Zalo configuration/settings screen and related form validation/submission states.
- Affected config layer: write/update helpers that build targeted config updates for `channels.zalo`.
- Affected gateway integration: `config.set` payload creation and read-after-write state consistency for Zalo config.