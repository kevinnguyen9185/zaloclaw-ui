## ADDED Requirements

### Requirement: Dashboard SHALL always show an agent chat surface
The system SHALL render an agent chat surface in the main dashboard experience so users can observe assistant feedback while using dashboard features.

#### Scenario: Chat visible on dashboard load
- **WHEN** user opens the dashboard
- **THEN** the page shows the agent chat surface without requiring navigation to setup pages
- **AND** dashboard controls remain operable alongside chat

### Requirement: Dashboard routes SHALL keep agent chat visible during navigation
The system SHALL keep the agent chat surface available across dashboard routes and preserve session continuity while users navigate.

#### Scenario: Chat continuity across dashboard route transitions
- **WHEN** user navigates between dashboard routes
- **THEN** existing chat messages remain visible
- **AND** draft input state is preserved for the current dashboard session

### Requirement: Dashboard actions SHALL be reflected in chat context immediately
The system SHALL forward meaningful dashboard action signals to chat context so assistant responses can reflect user changes immediately.

#### Scenario: Context update after dashboard action
- **WHEN** user performs a dashboard action that changes relevant state
- **THEN** chat context receives a corresponding action signal
- **AND** subsequent assistant responses can reference the updated dashboard state

### Requirement: Dashboard chat layout SHALL remain usable on narrow viewports
The system SHALL provide responsive behavior that keeps both dashboard controls and chat reachable on smaller screens.

#### Scenario: Mobile dashboard with accessible chat
- **WHEN** user is on a narrow viewport dashboard screen
- **THEN** user can open and interact with chat from the same dashboard view
- **AND** dashboard controls are not permanently obscured by chat
