## 1. Backend command runner

- [ ] 1.1 Add local API route to accept command string and execute OpenClaw command in Docker container.
- [ ] 1.2 Read container target from `OPENCLAW_GATEWAY_CONTAINER` with default `zaloclaw-infra-openclaw-gateway-1`.
- [ ] 1.3 Enforce basic validation, execution timeout, and structured response payload.

## 2. Shared command service client

- [ ] 2.1 Add reusable frontend service helper for calling local command-execution API.
- [ ] 2.2 Normalize success/error parsing so any UI surface can consume command results consistently.

## 3. Zalo onboarding integration (first consumer)

- [ ] 3.1 Add generic command input in Zalo screen for operator commands (string-based).
- [ ] 3.2 Add execute action that calls shared service and displays stdout/stderr/exit result.
- [ ] 3.3 Keep approval-focused UX intact while enabling manual operator command override.

## 4. Verification

- [ ] 4.1 Test successful run with `pairing approve <code>` command.
- [ ] 4.2 Test failure modes: invalid command, missing container, timeout.
- [ ] 4.3 Validate no regression in existing status and pairing guide flows.
