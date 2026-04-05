## Why

Users experience frustration when openclaw or zalo integrations silently fail or become disconnected. Currently, errors only surface when users attempt an action. Proactive status monitoring ensures we can detect connection issues early, surface recovery options quickly, and guide users back to valid states before critical failures occur.

## What Changes

- **Global Status Monitor**: New service that checks openclaw and zalo connection status every 30 seconds
- **Status UI Indicators**: Visual feedback in dashboard and onboarding showing connection health
- **Recovery Workflows**: When status checks fail, automatically surface relevant recovery steps (re-configuration, re-authentication, troubleshooting)
- **Graceful Degradation**: UI components adapt based on connection status to prevent operations on unavailable services

## Capabilities

### New Capabilities
- `connection-status-monitor`: Periodic global status checking for openclaw and zalo with configurable intervals and health thresholds
- `status-recovery-ui`: UI patterns and components for displaying connection health and recovery actions

### Modified Capabilities
- `dashboard-shell`: Status indicators and recovery UI integration in the main dashboard layout
- `onboarding-wizard`: Recovery flows when connection issues are detected during onboarding
- `gateway-client`: Expose connection status queries and subscription endpoints

## Impact

- **New Components**: Status monitor service, status indicator UI, recovery dialog components
- **Modified Components**: Dashboard layout, onboarding flow, gateway client layer
- **Dependencies**: No new external dependencies; uses existing openclaw/zalo configuration
- **User Experience**: Proactive health monitoring, faster issue resolution, reduced silent failures
