## Why

The current UI handles OpenClaw configuration as loosely structured JSON-like payloads, which makes loading and updating nested settings error-prone as the config surface grows. We need a robust, maintainable configuration workflow now because onboarding and settings depend on stable `config.get`/`config.set` behavior for gateway-managed devices.

## What Changes

- Introduce a typed configuration domain model that maps OpenClaw config sections to explicit TypeScript structures.
- Add a normalization and serialization layer for `config.get` payloads so UI code reads a stable shape regardless of optional or missing fields.
- Add a sustainable patch/update mechanism for `config.set` that supports targeted nested updates instead of ad-hoc object mutation.
- Centralize config read/write operations behind a dedicated gateway config service API used by onboarding and settings flows.
- Add validation and fallback defaults for critical fields used by current UI flows (model provider, model selection, gateway and channel-related settings).

## Capabilities

### New Capabilities
- `gateway-config-management`: Typed load, normalize, validate, and patch-based update workflow for OpenClaw config via websocket `config.get` and `config.set`.

### Modified Capabilities
- `onboarding-wizard`: The wizard reads and writes configuration through the new structured config service rather than direct/raw object handling.

## Impact

- Affected code:
  - Gateway client and config-facing API utilities in `src/lib/gateway/`
  - OpenClaw config utilities in `src/lib/openclaw-config.ts`
  - Onboarding flows in `src/app/(onboarding)/`
- APIs:
  - Internal UI-facing config interfaces and update calls
  - Existing websocket methods (`config.get`, `config.set`) remain unchanged externally
- Dependencies/systems:
  - TypeScript domain types and validators for config sections
  - Test suites for config parsing, normalization, and update behavior
