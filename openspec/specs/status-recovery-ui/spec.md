## ADDED Requirements

### Requirement: Status indicator display
The system SHALL display visual indicators of openclaw and zalo connection status in relevant UI locations.

#### Scenario: Display in dashboard
- **WHEN** the dashboard is displayed
- **THEN** a status indicator shows the current connection state of openclaw and zalo

#### Scenario: Status color coding
- **WHEN** status indicators are rendered
- **THEN** connected services display as green, disconnected as red, unknown as gray

#### Scenario: Indicator tooltip
- **WHEN** user hovers over a status indicator
- **THEN** a tooltip displays the service name and last check timestamp

### Requirement: Recovery dialog UI
The system SHALL display recovery options when a persistent disconnection is detected.

#### Scenario: Automatic recovery dialog
- **WHEN** a service is detected as disconnected after the grace period
- **THEN** a modal dialog appears offering recovery actions

#### Scenario: Recovery action options
- **WHEN** the recovery dialog is displayed
- **THEN** it offers options: "Reconfigure", "Re-authenticate", "View Documentation", "Dismiss"

#### Scenario: Reconfigure action
- **WHEN** user clicks "Reconfigure"
- **THEN** the user is navigated to the service settings page with the disconnected service highlighted

#### Scenario: Re-authenticate action
- **WHEN** user clicks "Re-authenticate"
- **THEN** the corresponding authentication flow is triggered for that service

#### Scenario: View documentation action
- **WHEN** user clicks "View Documentation"
- **THEN** external documentation or troubleshooting guide is opened in a new tab

#### Scenario: Dismiss action
- **WHEN** user clicks "Dismiss"
- **THEN** the dialog closes and the user can continue with other work

### Requirement: Graceful feature degradation
The system SHALL disable or adapt UI features based on service availability.

#### Scenario: Feature requires unavailable service
- **WHEN** a service is disconnected
- **THEN** UI features that depend on that service are disabled or removed

#### Scenario: Disabled feature indication
- **WHEN** a feature is disabled due to unavailable service
- **THEN** the disabled UI element displays a tooltip explaining the reason

### Requirement: Manual status refresh
The system SHALL provide a way for users to manually trigger status checks.

#### Scenario: Refresh button in interface
- **WHEN** status indicators are displayed
- **THEN** a "Check Now" or refresh button is visible near status indicators

#### Scenario: Manual check execution
- **WHEN** user clicks the refresh button
- **THEN** status checks are immediately performed and results are displayed

#### Scenario: Check in progress indication
- **WHEN** a manual status check is in progress
- **THEN** the refresh button shows a loading indicator
