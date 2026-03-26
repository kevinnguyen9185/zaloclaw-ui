## ADDED Requirements

### Requirement: Display real-time device readiness status
The system SHALL provide a real-time display showing the current state of device credentials, tokens, and WebSocket connection, updating automatically when state changes.

#### Scenario: Device ID and keys status visible
- **WHEN** diagnostics panel is open
- **THEN** display shows whether device ID, public key, and private key are loaded
- **AND** marks each with a green checkmark if present and valid
- **AND** marks with red X if missing

#### Scenario: Device token cached status visible
- **WHEN** diagnostics panel is open and device token is cached
- **THEN** display shows "Device Token: Cached (X hours remaining)"
- **AND** updates the value periodically as time passes

#### Scenario: Request ID counter visible
- **WHEN** diagnostics panel is open
- **THEN** display shows current request ID counter and next projected value
- **AND** updates in real-time as RPC calls are made

#### Scenario: Device state updates trigger UI refresh
- **WHEN** device storage state changes (e.g., after successful connect)
- **THEN** diagnostics panel updates display within 100ms
- **AND** does NOT require full page reload

### Requirement: Display WebSocket connection readiness
The system SHALL display the current WebSocket connection state, authentication status, and any error messages in real-time.

#### Scenario: Connection state shown with clear labels
- **WHEN** diagnostics panel is open
- **THEN** display shows one of: "Connected", "Connecting", "Disconnected", "Reconnecting", "Error"
- **AND** shows reason if disconnected or error (e.g., "Connection closed: code 1000")

#### Scenario: Connection state changes update panel
- **WHEN** WebSocket connection state changes
- **THEN** diagnostics panel updates display within 50ms
- **AND** shows timestamp of last state change

#### Scenario: Reconnection attempts visible
- **WHEN** system is attempting to reconnect after disconnect
- **THEN** display shows "Reconnecting (attempt 3 of N)"
- **AND** shows time until next retry

### Requirement: Environment variable validation checklist
The system SHALL display which required environment variables are present and valid.

#### Scenario: Required environment variables checked
- **WHEN** diagnostics panel opens
- **THEN** display shows checklist of: DEVICE_ID, DEVICE_PUBLIC_KEY, DEVICE_PRIVATE_KEY
- **AND** marks each as present (green) or missing (red)

#### Scenario: Optional variables labeled
- **WHEN** optional environment variables are checked (e.g., DEVICE_TOKEN)
- **THEN** display marks them as "(optional)"
- **AND** shows "auto-cached on connect" if not in env but stored

### Requirement: Recent RPC call history visible
The system SHALL track and display the last 5 RPC calls with their status, method, and latency.

#### Scenario: RPC calls logged with status
- **WHEN** RPC method is called via GatewayClient
- **THEN** diagnostics records: method name, status (pending/success/error), latency, error message if failed

#### Scenario: Recent call history displayed
- **WHEN** diagnostics panel shows RPC history
- **THEN** displays last 5 calls with format: "1. models.list (success, 245ms)"
- **AND** shows error message for failed calls (e.g., "RPC error: timeout")

#### Scenario: History limited to 5 entries
- **WHEN** 6th RPC call is logged
- **THEN** oldest entry is removed from display
- **AND** memory usage stays bounded

### Requirement: Debug mode access via URL parameter
The system SHALL allow access to diagnostics panel via a hidden URL query parameter in development builds.

#### Scenario: Access diagnostics with query param
- **WHEN** URL includes `?debug=gateway` and app is in development mode
- **THEN** diagnostics panel is rendered and visible
- **AND** panel does NOT appear in production builds

#### Scenario: Query param is discoverable but hidden
- **WHEN** user visits app without debug param
- **THEN** diagnostics panel is hidden
- **AND** no UI hints indicate its existence (security by obscurity for dev-only feature)

### Requirement: Browser console API for diagnostics
The system SHALL expose a `window.gatewayDiagnostics` API for programmatic access to device and connection status in development builds.

#### Scenario: Console API available in development
- **WHEN** app runs in development mode
- **THEN** `window.gatewayDiagnostics.check()` returns current device state
- **AND** returns object with: { device, token, wsStatus, env, valid: boolean }

#### Scenario: Console API hidden in production
- **WHEN** app is built for production
- **THEN** `window.gatewayDiagnostics` is undefined
- **AND** no diagnostic data is exposed

#### Scenario: Console API methods available
- **WHEN** `window.gatewayDiagnostics` is accessible
- **THEN** following methods are available:
  - `.check()` — returns current diagnostic state
  - `.clear()` — clears all device state (logout)
  - `.reload()` — reloads app after state change

### Requirement: Real-time updates with minimal performance impact
The system SHALL update diagnostics display reactively to state changes without causing noticeable performance degradation.

#### Scenario: Updates debounced for high-frequency events
- **WHEN** RPC calls happen in rapid succession
- **THEN** diagnostics UI updates are debounced (max 1 update per 100ms)
- **AND** final state reflects all changes

#### Scenario: Storage subscribers are centralized
- **WHEN** device storage changes
- **THEN** single global event subscriber notifies diagnostics system
- **AND** no memory leaks from multiple listeners

#### Scenario: Display uses efficient React rendering
- **WHEN** diagnostics panel renders
- **THEN** React.memo prevents unnecessary re-renders of child components
- **AND** only affected sections re-render on state change

### Requirement: Minimal visual footprint
The system SHALL display diagnostics in a compact, non-intrusive way that doesn't interfere with app functionality.

#### Scenario: Compact status badge in corner
- **WHEN** diagnostics are enabled (via debug flag or console API)
- **THEN** small status badge appears in bottom-right corner
- **AND** shows connection status with color coding (green/yellow/red)

#### Scenario: Expandable panel on demand
- **WHEN** user clicks status badge
- **THEN** panel expands to show full diagnostic details
- **AND** panel can be dismissed with close button

#### Scenario: No persistent UI elements by default
- **WHEN** diagnostics are not explicitly enabled
- **THEN** no UI elements are rendered
- **AND** zero performance impact to app
