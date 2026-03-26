## Why

Developers and operators need quick visibility into device readiness and WebSocket connection state to debug integration issues. Currently, there's no built-in way to check:
- Is the device ID loaded and valid?
- Is the WebSocket connected and authenticated?
- Is the device token cached?
- Are all required environment variables present?

This causes slow debugging cycles when things fail silently. A diagnostic UI will reduce time-to-resolution and make the gateway integration more transparent.

## What Changes

### New UI Component/Utility
- **Device Diagnostics Panel**: Real-time status display showing:
  - Device ID (present? valid format?)
  - Device Token (cached? expiration estimate?)
  - Request ID counter (current, next projected)
  - WebSocket connection state (what's the current status, why if disconnected)
  - Environment variable checklist (required vars present?)
  - Recent RPC calls (last 5, with status/errors)

### Display Options
- Debug mode accessible via URL query param (`?debug=gateway`)
- Browser console API (`window.gatewayDiagnostics.check()`)
- Dedicated `/diagnostics` page (optional)
- Status badge that appears on connection state changes

### Real-time Updates
- Listens to device storage changes (device-storage.ts events)
- Listens to WebSocket status changes from GatewayClient
- Updates diagnostics display without full page reload

## Capabilities

### New Capabilities
- `gateway-diagnostics-panel`: Real-time UI showing device, token, and connection readiness
- `gateway-diagnostics-api`: Console/programmatic API for checking device state (`window.gatewayDiagnostics.check()`)
- `gateway-status-visibility`: Hidden debug mode accessible via URL params or console commands

### Modified Capabilities
- `device-storage` (from gateway-device-persistence): Add event emitters for storage changes so diagnostics can react to state updates

## Impact

- **Code**: New component in `src/lib/gateway/` (e.g., `gateway-diagnostics.ts`, `GatewayDiagnosticsPanel.tsx` React component)
- **APIs**: New diagnostic helpers in device-storage.ts (events), new exports in device-identity.ts
- **UI**: Minimal visual footprint; debug panel hidden by default
- **Performance**: Negligible (only updates on actual state changes)
- **Dependencies**: None new (uses existing storage and client infrastructure)
- **User Opt-in**: Debug features disabled in production builds unless explicitly enabled via env var
