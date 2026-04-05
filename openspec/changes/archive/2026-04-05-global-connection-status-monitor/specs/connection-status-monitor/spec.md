## ADDED Requirements

### Requirement: Global periodic status checking
The system SHALL check the connection status of openclaw and zalo services at regular intervals (30 seconds) without requiring user action.

#### Scenario: Successful status check
- **WHEN** the status monitor timer interval elapses
- **THEN** the system invokes status check methods for openclaw and zalo via the gateway client

#### Scenario: Handle check success
- **WHEN** a status check completes successfully
- **THEN** the status for that service is updated to "connected"

#### Scenario: Handle check failure
- **WHEN** a status check fails or times out
- **THEN** the status for that service is updated to "disconnected"

### Requirement: Centralized status state management
The system SHALL maintain and expose global connection status via a React Context, accessible to any UI component.

#### Scenario: Status context availability
- **WHEN** the application initializes
- **THEN** a ConnectionStatusContext is created and available via React Context API

#### Scenario: Subscribe to status updates
- **WHEN** a component calls useConnectionStatus() hook
- **THEN** the component receives current status and is notified of changes

#### Scenario: Status shape
- **WHEN** useConnectionStatus() is called
- **THEN** the return value includes: openclaw status, zalo status, timestamp of last check, and error details if applicable

### Requirement: Detection of persistent failures
The system SHALL distinguish between intermittent failures and persistent disconnections using a grace period mechanism.

#### Scenario: Transient failure
- **WHEN** one status check fails but the next succeeds
- **THEN** the service remains marked as "connected" and no recovery workflow is triggered

#### Scenario: Persistent failure detection
- **WHEN** two consecutive status checks fail
- **THEN** the service is marked as "disconnected" and a recovery workflow is triggered

### Requirement: Conditional status checking
The system SHALL honor browser visibility to avoid unnecessary network requests when the page is in background.

#### Scenario: Page visible
- **WHEN** the page is visible to the user
- **THEN** status checks continue at the configured interval

#### Scenario: Page backgrounded
- **WHEN** the page is hidden (background tab)
- **THEN** status checks are paused until the page becomes visible again
