## ADDED Requirements

### Requirement: Command execution service SHALL be reusable by multiple UI surfaces
The system SHALL expose one stable local command-execution contract that can be consumed by any UI screen requiring operator command execution.

#### Scenario: Two screens share same service contract
- **WHEN** onboarding and another UI screen invoke OpenClaw command execution
- **THEN** both call the same backend contract and receive the same result schema
- **AND** no screen-specific backend endpoint is required

### Requirement: Local backend SHALL execute OpenClaw operator command strings inside gateway container
The system SHALL provide a local backend endpoint that accepts an OpenClaw command string and executes it inside the gateway container context.

#### Scenario: Execute command successfully
- **WHEN** user submits command `pairing approve Q2ACK6WB`
- **THEN** backend executes `docker exec -i --user node <container> openclaw pairing approve Q2ACK6WB`
- **AND** response includes `ok: true`, `exitCode: 0`, and captured output

#### Scenario: Target container not found
- **WHEN** configured container name does not exist locally
- **THEN** endpoint returns a failure response with actionable error text
- **AND** no browser RPC fallback is attempted

### Requirement: Command execution SHALL use env-configurable container target with safe default
The system SHALL target gateway container by environment value and default to the known local container name.

#### Scenario: Use default container name
- **WHEN** `OPENCLAW_GATEWAY_CONTAINER` is unset
- **THEN** backend targets `zaloclaw-infra-openclaw-gateway-1`

#### Scenario: Use overridden container name
- **WHEN** `OPENCLAW_GATEWAY_CONTAINER` is set
- **THEN** backend targets that value for docker execution

### Requirement: Endpoint SHALL apply validation and bounded execution
The system SHALL reject invalid input and prevent indefinite process hangs.

#### Scenario: Reject empty command
- **WHEN** request command is empty or whitespace
- **THEN** endpoint returns validation error without running docker

#### Scenario: Timeout execution
- **WHEN** command exceeds configured timeout
- **THEN** backend terminates process and returns `timedOut: true` with failure state
