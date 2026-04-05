## ADDED Requirements

### Requirement: Dashboard shell SHALL host a persistent chat panel
The dashboard shell SHALL include a persistent chat panel region that coexists with dashboard content.

#### Scenario: Shell renders chat panel with dashboard content
- **WHEN** dashboard shell renders
- **THEN** shell layout includes both dashboard content region and chat panel region
- **AND** users can interact with both regions in the same session

### Requirement: Dashboard shell SHALL preserve chat state across dashboard route transitions
The dashboard shell SHALL keep chat panel state intact when transitioning between dashboard routes.

#### Scenario: Shell keeps chat session between dashboard routes
- **WHEN** user navigates between dashboard routes
- **THEN** chat history remains available
- **AND** chat UI state does not reset unless dashboard session is explicitly restarted

### Requirement: Dashboard shell SHALL use a split workspace layout on large screens
The dashboard shell SHALL present dashboard workspace content and persistent chat in separate columns on large screens.

#### Scenario: Large-screen split workspace
- **WHEN** user views the dashboard on an `xl` or larger viewport
- **THEN** dashboard status and configuration content are rendered in the left column
- **AND** the persistent chat panel is rendered in the right column without obscuring workspace controls

### Requirement: Dashboard shell status surfaces SHALL remain compact when chat is persistent
The dashboard shell SHALL present active model and Zalo channel status in a compact summary form when persistent chat is visible.

#### Scenario: Compact dashboard status row
- **WHEN** the dashboard renders with persistent chat enabled
- **THEN** active model and Zalo channel surfaces remain visible near the top of the workspace
- **AND** they do not consume the same visual weight as the primary configuration or chat surfaces
