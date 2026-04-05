## ADDED Requirements

### Requirement: Dashboard shell displays connection status indicators
The dashboard shell header SHALL display visual status indicators for openclaw and zalo connection health.

#### Scenario: Status indicators rendered
- **WHEN** the dashboard shell is rendered
- **THEN** status indicators for openclaw and zalo are visible in the header/top navigation area

#### Scenario: Connected service indicator
- **WHEN** a service is connected
- **THEN** its status indicator displays green with a "connected" visual state

#### Scenario: Disconnected service indicator
- **WHEN** a service is disconnected
- **THEN** its status indicator displays red with a "disconnected" visual state

#### Scenario: Status indicator interactive feedback
- **WHEN** user hovers over a status indicator
- **THEN** a tooltip shows the service name and last check timestamp

### Requirement: Dashboard shell provides manual status check capability
The dashboard shell SHALL include a button or control to manually trigger status verification.

#### Scenario: Refresh button visible
- **WHEN** the dashboard shell is rendered
- **THEN** a refresh or "Check Status" button is visible near status indicators

#### Scenario: Manual refresh initiation
- **WHEN** user clicks the status refresh button
- **THEN** status checks are immediately performed and indicators update

#### Scenario: Refresh in progress indication
- **WHEN** status check is in progress
- **THEN** the refresh button displays a loading spinner

### Requirement: Dashboard shell surfaces recovery actions for disconnected services
The dashboard shell SHALL provide quick access to recovery workflows when services are disconnected.

#### Scenario: Recovery action link
- **WHEN** a service is disconnected
- **THEN** a clickable "Reconfigure" or "Fix" link is available on its status indicator

#### Scenario: Reconfigure navigation
- **WHEN** user clicks the recovery link
- **THEN** user is navigated to settings page for that service

#### Scenario: Status-triggered recovery dialog
- **WHEN** a persistent disconnection is detected and dashboard is visible
- **THEN** a recovery dialog is displayed with options to reconfigure or view help
