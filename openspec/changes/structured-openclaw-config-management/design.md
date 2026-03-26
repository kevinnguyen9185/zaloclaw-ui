## Context

The current UI receives OpenClaw configuration through websocket `config.get` responses that include both a raw text representation and a parsed object. Configuration updates are currently handled in flow-specific code paths, which increases risk when writing nested keys and when optional sections are absent. This change introduces a shared configuration domain model and update service so onboarding and settings can read and mutate config consistently.

Constraints:
- Keep external gateway protocol unchanged (`config.get`, `config.set`).
- Support partially populated configs from older OpenClaw versions.
- Preserve unknown fields during updates to avoid destructive writes.

## Goals / Non-Goals

**Goals:**
- Define a typed, normalized config representation for UI use.
- Centralize config loading, validation, and patch-based update operations.
- Ensure nested updates are deterministic and preserve unrelated sections.
- Enable onboarding wizard to use structured reads/writes instead of raw object mutation.
- Provide testable behavior for load/serialize/update paths.

**Non-Goals:**
- Changing OpenClaw websocket method names or transport contract.
- Redesigning all OpenClaw config sections in one change.
- Building a full schema registry for every OpenClaw plugin in this phase.

## Decisions

1. Introduce a configuration domain layer in UI code.
- Decision: Add TypeScript domain types for config sections currently used by UI flows and a normalized in-memory model.
- Rationale: Typed access reduces runtime errors and clarifies update intent.
- Alternatives considered:
  - Keep free-form object handling with helper utilities: rejected due to weak compile-time guarantees.
  - Import full server-side schema package: rejected for coupling and release friction.

2. Use path-based patch operations for updates.
- Decision: Implement a patch builder (`set`, `unset`, and object-merge semantics) that emits deterministic update payloads for `config.set`.
- Rationale: Targeted updates avoid accidental overwrite of sibling branches.
- Alternatives considered:
  - Send full config snapshots on every write: rejected due to high overwrite risk and conflict behavior.
  - Per-flow custom mutation functions: rejected as unsustainable.

3. Normalize and validate on read, serialize on write.
- Decision: `config.get` responses are normalized into a stable model with defaults for critical keys; writes serialize only changed branches while preserving unknown data.
- Rationale: Stability for UI plus forward compatibility with evolving config structures.
- Alternatives considered:
  - Strict rejection of missing/unknown fields: rejected because legacy configs are common.

4. Encapsulate gateway operations behind a config service.
- Decision: Add a dedicated service module that is the single integration point for `config.get`/`config.set`.
- Rationale: Improves maintainability and testability across onboarding and settings.

## Risks / Trade-offs

- [Normalization diverges from real server semantics] -> Mitigation: maintain contract tests using realistic sample payloads and explicit defaults documentation.
- [Patch semantics may not match all nested edge cases] -> Mitigation: define unit tests for arrays, nullables, and absent-parent paths before integrating flows.
- [Partial typing leaves some sections as unknown] -> Mitigation: use explicit escape-hatch type for unmodeled branches and incrementally expand coverage.
- [Concurrent UI writes can race] -> Mitigation: add read-after-write refresh in service and idempotent patch generation.

## Migration Plan

1. Introduce domain types and normalization utilities with tests.
2. Add config service for load/update and integrate gateway client calls.
3. Migrate onboarding model step and related config writes to the service.
4. Migrate settings pages touching overlapping keys.
5. Remove obsolete raw-mutation helpers and align tests.

Rollback:
- Revert onboarding/settings call sites to previous config helper and disable patch-path updates while preserving gateway transport.

## Open Questions

- Should the UI emit one batched `config.set` per step or one call per field edit?
- Which config branches are mandatory for v1 typed coverage versus deferred to later increments?
- Should serialization preserve original key ordering from `raw` for minimal diffs?
