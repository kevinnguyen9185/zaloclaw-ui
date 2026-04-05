## ADDED Requirements

### Requirement: Zalo onboarding SHALL expose a generic operator command input
The Zalo onboarding step SHALL provide a command input for local operator execution when browser RPC cannot run privileged commands.

#### Scenario: Command input visible on Zalo step
- **WHEN** user is on onboarding Zalo page
- **THEN** the page shows an input for OpenClaw command string
- **AND** the execute action is available when input is non-empty
- **AND** execution is routed through the shared command service contract

### Requirement: Zalo onboarding SHALL render command execution result details
The Zalo onboarding step SHALL show execution outcomes after operator command submission.

#### Scenario: Command succeeds
- **WHEN** execution returns success
- **THEN** UI shows success state with relevant output summary
- **AND** user can refresh Zalo status immediately

#### Scenario: Command fails
- **WHEN** execution returns non-zero exit code or timeout
- **THEN** UI shows failure state and surfaced error/output details
- **AND** user can edit and retry command without page reload

### Requirement: Approval workflow SHALL support explicit operator command path
The pairing approval flow SHALL support direct operator command entry using `pairing approve <code>`.

#### Scenario: Operator enters pairing approval command manually
- **WHEN** user pastes or types `pairing approve <code>` in command input
- **THEN** system executes it through local backend command runner
- **AND** command result is displayed in the onboarding page context
