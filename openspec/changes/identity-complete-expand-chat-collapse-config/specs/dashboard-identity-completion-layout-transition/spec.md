## ADDED Requirements

### Requirement: Identity completion SHALL switch dashboard to chat-focused mode
The system SHALL transition dashboard layout to chat-focused mode when bot identity setup completes successfully.

#### Scenario: Successful identity completion triggers chat focus
- **WHEN** user completes identity setup and generation succeeds
- **THEN** dashboard layout enters chat-focused mode
- **AND** chat panel expands to become the primary visible region

### Requirement: Configuration panel SHALL collapse after identity completion
The system SHALL collapse identity configuration once identity setup completes successfully.

#### Scenario: Configuration auto-collapses on completion
- **WHEN** identity completion success is confirmed
- **THEN** identity configuration panel is collapsed
- **AND** the user can reopen configuration without losing saved identity values

### Requirement: Chat-focused mode SHALL persist across dashboard route navigation
The system SHALL keep chat-focused mode and collapsed-configuration state while user navigates between dashboard routes in the same session.

#### Scenario: Route transition preserves focused layout
- **WHEN** user navigates from dashboard to another dashboard route after identity completion
- **THEN** chat-focused mode remains active
- **AND** configuration remains collapsed until user explicitly reopens it

### Requirement: Identity completion surface SHALL prioritize next actions over artifact previews
The system SHALL keep the primary dashboard identity surface focused on chatting and follow-up configuration rather than inline generated artifact previews.

#### Scenario: Completed identity flow without inline artifact card
- **WHEN** identity setup has been generated successfully on the dashboard
- **THEN** the main identity surface does not display inline `AGENT.md`, `SOUL.md`, or `USER.md` preview blocks
- **AND** the user can continue directly into chat or adjacent dashboard configuration actions
