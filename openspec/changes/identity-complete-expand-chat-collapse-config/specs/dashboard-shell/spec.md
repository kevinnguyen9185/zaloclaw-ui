## ADDED Requirements

### Requirement: Dashboard shell SHALL support chat-focused and balanced layout modes
The dashboard shell SHALL provide at least balanced mode and chat-focused mode to manage chat and configuration emphasis.

#### Scenario: Shell applies chat-focused mode
- **WHEN** shell receives a transition to chat-focused mode
- **THEN** chat region is rendered as the dominant area
- **AND** configuration region is rendered collapsed by default

### Requirement: Dashboard shell SHALL provide explicit recovery controls from collapsed configuration
The dashboard shell SHALL provide an explicit control to reopen configuration after automatic collapse.

#### Scenario: Reopen configuration from chat-focused mode
- **WHEN** user activates reopen configuration control
- **THEN** configuration region is expanded and interactive
- **AND** chat remains available without route reload

### Requirement: Dashboard shell responsive behavior SHALL remain usable in chat-focused mode
The dashboard shell SHALL keep both chat and configuration controls accessible at mobile and desktop breakpoints in chat-focused mode.

#### Scenario: Mobile chat-focused accessibility
- **WHEN** user is on a narrow viewport with chat-focused mode active
- **THEN** chat content remains readable and operable
- **AND** configuration reopen control remains reachable
