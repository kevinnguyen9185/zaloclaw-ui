## ADDED Requirements

### Requirement: Device credentials persist across sessions
The system SHALL store device credentials (deviceId, public key, private key) in persistent storage and retrieve them on application initialization without requiring re-pairing or re-entry.

#### Scenario: First initialization with environment variables
- **WHEN** app starts and device environment variables (`DEVICE_ID`, `DEVICE_PUBLIC_KEY`, `DEVICE_PRIVATE_KEY`) are set
- **THEN** system stores these credentials in persistent storage (localStorage on browser, file system on Node.js)
- **AND** subsequent app starts reuse the stored credentials without requiring environment variables again

#### Scenario: Corrupted or missing storage file
- **WHEN** persistent storage file is corrupted or missing
- **THEN** system logs a warning and re-initializes from environment variables
- **AND** creates a new valid storage file

#### Scenario: Device credentials change
- **WHEN** environment variables are updated with new device credentials
- **THEN** system detects the change and updates persistent storage
- **AND** maintains the request ID counter (for consistency)
- **AND** clears any cached device token (requires re-authentication with new device)

### Requirement: DeviceToken caches across sessions
The system SHALL persist the device authentication token (deviceToken) received from the gateway after successful connect handshake, and reuse it to avoid repeated pairing approvals.

#### Scenario: Token received on successful connect
- **WHEN** gateway responds with ok=true and includes deviceToken in payload
- **THEN** system stores the deviceToken in persistent storage
- **AND** subsequent connections include this cached token in auth parameters

#### Scenario: Token persists across app restart
- **WHEN** app restarts after caching a deviceToken
- **THEN** system retrieves the cached token from storage
- **AND** uses it in the next connection attempt
- **AND** does NOT require a new pairing approval

#### Scenario: Token cleared on device reset
- **WHEN** user calls `clearDeviceState()` API
- **THEN** system deletes the cached deviceToken from storage
- **AND** next connection will require a new pairing approval

### Requirement: Request IDs are globally unique
The system SHALL maintain a globally incrementing request ID counter in persistent storage to ensure request IDs never collide across application restarts or concurrent sessions.

#### Scenario: Counter persists across sessions
- **WHEN** app generates request ID N and then restarts
- **THEN** next request ID generated is N+1 (not 1)
- **AND** no collision occurs between pre- and post-restart requests

#### Scenario: Counter increments on every RPC call
- **WHEN** `getNextRequestId()` is called
- **THEN** system returns a unique ID
- **AND** increments the counter in persistent storage
- **AND** subsequent calls return monotonically increasing values

#### Scenario: Multiple rapid calls generate unique IDs
- **WHEN** multiple `getNextRequestId()` calls are made in quick succession
- **THEN** each call returns a different ID
- **AND** all IDs are unique even if processed concurrently

### Requirement: Multi-backend persistent storage with automatic fallback
The system SHALL support multiple storage backends (in-memory cache, browser localStorage, Node.js file system) and automatically select the appropriate backend based on the runtime environment.

#### Scenario: Browser environment uses localStorage
- **WHEN** app runs in a browser
- **THEN** system uses browser `localStorage["zaloclaw.device"]` as primary persistent storage
- **AND** falls back to in-memory cache if localStorage is unavailable

#### Scenario: Node.js environment uses file system
- **WHEN** app runs in Node.js (tests, server-side)
- **THEN** system uses `.tmp-zaloclaw-device.json` file in project root as persistent storage
- **AND** creates directories as needed
- **AND** falls back to in-memory cache if file I/O fails

#### Scenario: In-memory cache is always primary
- **WHEN** storage system loads or saves state
- **THEN** in-memory cache is checked first for performance
- **AND** subsequent operations use cached value if available
- **AND** only hits persistent backend when cache is empty

### Requirement: Storage format is JSON-serializable
The system SHALL store device state in a standardized JSON format that is human-readable and supports schema evolution.

#### Scenario: Storage format is readable
- **WHEN** developer inspects storage file (`.tmp-zaloclaw-device.json` or localStorage)
- **THEN** contents are valid JSON with clear property names
- **AND** file is pretty-printed for readability (Node.js)

#### Scenario: Storage includes timestamp for versioning
- **WHEN** device state is stored
- **THEN** storage includes an `updatedAt` timestamp for audit and versioning purposes
- **AND** timestamp is updated on every save operation
