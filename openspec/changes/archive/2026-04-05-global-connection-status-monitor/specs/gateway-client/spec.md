## ADDED Requirements

### Requirement: Gateway client exposes service status check methods
The gateway client SHALL provide methods to check the connection status of openclaw and zalo services.

#### Scenario: Check openclaw status
- **WHEN** a component calls `gateway.checkOpenclawStatus()`
- **THEN** the gateway issues a status check request and returns success or error

#### Scenario: Check zalo status
- **WHEN** a component calls `gateway.checkZaloStatus()`
- **THEN** the gateway issues a status check request and returns success or error

#### Scenario: Status check timeout
- **WHEN** a status check does not complete within 5 seconds
- **THEN** the check is aborted and an error is returned

#### Scenario: Status check error response
- **WHEN** the server returns an error for a status check
- **THEN** the error details are included in the rejected promise

### Requirement: Status check methods are non-blocking
Status checks SHALL not block other gateway operations and SHALL run independently.

#### Scenario: Concurrent requests with status check
- **WHEN** a component calls `send()` while a status check is in progress
- **THEN** the send request is processed normally without waiting for the status check

#### Scenario: Multiple simultaneous status checks
- **WHEN** multiple components request status checks concurrently
- **THEN** each request is processed independently

### Requirement: Gateway exposes current cached status
The gateway client SHALL expose the most recent status check results without requiring a fresh check.

#### Scenario: Get cached status
- **WHEN** a component calls `gateway.getStatus()` or similar
- **THEN** it receives the most recent status check results with a timestamp

#### Scenario: Stale status indication
- **WHEN** cached status is older than a certain threshold
- **THEN** it is marked as stale to indicate it needs refresh
