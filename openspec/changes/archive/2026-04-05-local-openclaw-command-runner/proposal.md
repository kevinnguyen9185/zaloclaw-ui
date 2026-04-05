## Why

The browser onboarding flow needs to trigger operator-level OpenClaw commands that are intentionally rejected over browser RPC for security boundaries. In local-only usage, operators still need a direct way to run these commands during Zalo pairing and troubleshooting.

Today this creates friction: users can paste pairing instructions but cannot reliably execute privileged commands such as approval when the gateway requires operator context.

## What Changes

- Add a local backend command service that executes OpenClaw commands inside the gateway Docker container.
- Accept a simple command string (OpenClaw subcommand) from UI and execute it as `openclaw <command>`.
- Target the container by configured name, defaulting to `zaloclaw-infra-openclaw-gateway-1`.
- Return structured execution results (stdout, stderr, exit code, timeout state) for immediate UI feedback.
- Provide a shared frontend client helper so any UI screen can call the same backend service contract.
- Integrate command-runner UX into the Zalo onboarding screen as the first consumer so operators can run approval and pairing commands without leaving the app.

## Capabilities

### New Capabilities
- `local-openclaw-command-service`: Local backend execution bridge for OpenClaw operator commands inside the gateway container, designed for reuse by multiple UI surfaces.

### Modified Capabilities
- `onboarding-wizard`: Extend Zalo step with a generic command input and execution feedback for operator commands.
- `gateway-client`: Add shared local API client interaction for privileged command execution outside normal browser RPC methods.

## Impact

- Affected backend: Next.js API route(s) under `src/app/api/gateway/` for command execution.
- Affected UI: shared command-service client plus Zalo onboarding page command input/actions/output display as initial adopter.
- Environment dependency: local Docker runtime and known gateway container name.
- Security posture: local-only route, input validation, bounded execution timeout, explicit `openclaw` prefixing.
