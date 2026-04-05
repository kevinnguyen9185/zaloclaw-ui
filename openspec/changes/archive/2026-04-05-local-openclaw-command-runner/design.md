## Context

OpenClaw browser RPC intentionally blocks operator-level commands. This is correct for untrusted client contexts, but this application runs locally and needs a practical operator path during pairing workflows.

The required command shape is simple and recurring:
- `openclaw pairing approve <code>`

Because browser RPC cannot execute this command, the application needs a trusted local bridge that can run OpenClaw commands in the gateway container and report results back to the UI.

## Goals / Non-Goals

**Goals:**
- Provide a local-only execution bridge for operator OpenClaw commands.
- Keep input model simple: user enters one command string.
- Execute command in the known gateway container with predictable defaults.
- Return clear execution diagnostics to UI.
- Ensure the backend contract is reusable so any UI screen can invoke operator commands.

**Non-Goals:**
- Expose operator commands through browser RPC.
- Support remote, internet-facing multi-tenant execution.
- Implement full shell access outside OpenClaw command scope.

## Decisions

1. Add a local API route for command execution.
- Decision: implement a server route under `src/app/api/gateway/` to run command requests.
- Rationale: browser cannot safely execute Docker commands directly.

1a. Add a shared frontend service wrapper.
- Decision: define a reusable frontend helper (gateway command service client) used by onboarding and future screens.
- Rationale: avoids duplicating request/response parsing and normalizes UI error handling.

2. Use container-name targeting with a default value.
- Decision: use env var `OPENCLAW_GATEWAY_CONTAINER` when present, fallback default `zaloclaw-infra-openclaw-gateway-1`.
- Rationale: container ID is unstable; name-based targeting is predictable in local setup.

3. Keep request contract as string command.
- Decision: request contains one string `command` representing OpenClaw subcommand.
- Rationale: aligns with operator mental model and avoids per-command route churn.

4. Force OpenClaw prefix on server execution.
- Decision: backend executes `docker exec -i --user node <container> openclaw <command>`.
- Rationale: preserves flexibility while limiting scope to OpenClaw CLI.

5. Add bounded execution and structured response.
- Decision: enforce timeout and return `{ ok, exitCode, stdout, stderr, timedOut }`.
- Rationale: deterministic UI behavior and easier troubleshooting.

6. Add lightweight input validation.
- Decision: reject empty command and obviously unsafe shell metacharacters.
- Rationale: local-only app still benefits from accidental misuse prevention.

## Risks / Trade-offs

- [Risk] Container name mismatch across environments.
  Mitigation: env override and clear error message when target container is missing.

- [Risk] Command string misuse or malformed input.
  Mitigation: validation, timeout, and explicit OpenClaw prefixing.

- [Trade-off] String command is flexible but less typed.
  Mitigation: keep focused on local operator workflows and surface rich runtime errors.

## Deployment Notes

- If this UI/backend is hosted inside another container, executing commands in a sibling container requires Docker daemon access from the app container.
- Recommended local setup: mount `/var/run/docker.sock` into the app container and ensure Docker CLI is available in the app runtime.
- Alternative setup: use a separate local executor service with Docker access and call it from this app.
- Security note: Docker socket access is privileged and should be treated as local/dev-only trust boundary.

## Migration Plan

1. Add API route for local command execution with env-configurable container target.
2. Add shared client utility for calling the command execution API.
3. Add command input and execute button to Zalo onboarding flow using the shared client.
4. Keep existing pairing-guide workflow; command runner complements blocked operator RPC commands.
5. Validate with local docker runtime and representative command: `pairing approve <code>`.

Rollback strategy:
- Remove UI command runner surface.
- Remove backend route and any env usage.
- Fall back to manual terminal execution by operator.

## Open Questions

- Should command history be persisted in localStorage for faster reruns?
- Should future versions include optional auto-discovery fallback when configured container name is missing?
