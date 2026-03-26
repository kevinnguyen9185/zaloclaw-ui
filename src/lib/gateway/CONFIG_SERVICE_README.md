# Gateway Config Service

This module centralizes OpenClaw config reads/writes for UI flows.

## Why

Use a single service for `config.get` and `config.set` to avoid ad-hoc nested object mutation and inconsistent defaults.

## Usage

- Create service from gateway send function:
  - `const service = createGatewayConfigService(send)`
- Read normalized config:
  - `const snapshot = await service.load()`
- Apply targeted updates:
  - `await service.update([{ op: "set", path: "agents.defaults.model.primary", value: "litellm/openclaw-smart-router" }])`

## Conventions

- Prefer `set` for scalar or full-object replacement at one path.
- Prefer `merge` for shallow branch updates where sibling keys must be preserved.
- Use `unset` only when removing optional keys.
- Keep paths stable and dot-delimited (for example `gateway.controlUi.allowInsecureAuth`).
- Do not mutate `snapshot.normalized.source` directly.

## Error Handling

- `load()` throws `Failed to load gateway config: ...` on transport/protocol failures.
- `update()` throws `Failed to save gateway config: ...` on write failures.
- UI callers should surface retry-capable messages and keep users on the current step.

## Notes

- The service preserves unknown branches by patching against the latest loaded source object.
- The gateway protocol remains unchanged (`config.get`, `config.set`).
