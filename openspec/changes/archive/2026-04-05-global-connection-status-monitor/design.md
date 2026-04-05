## Context

The application integrates with external services (openclaw and zalo) for core functionality. Currently:
- Errors only surface when users attempt operations
- No continuous health monitoring
- Users may not realize connections are broken until critical failures occur
- Onboarding wizard can proceed with invalid configurations

We need proactive status awareness to guide users toward recovery before failures cascade.

## Goals / Non-Goals

**Goals:**
- Implement a global status monitor that checks openclaw and zalo connectivity every 30 seconds
- Surface connection status in UI to provide immediate feedback
- Detect configuration/connection failures and automatically trigger recovery workflows
- Enable users to recover quickly without manual intervention
- Prevent operations on unavailable services through graceful UI adaptation

**Non-Goals:**
- Real-time event-driven monitoring (polling-based is appropriate for this use case)
- Automated remediation of failures (only guide users to documented recovery steps)
- Detailed logging/audit trails of status checks (basic logging for debugging is sufficient)
- Monitoring of other external services beyond openclaw and zalo

## Decisions

### 1. Polling-based Status Checks (Interval: 30 seconds)
**Decision**: Use periodic polling rather than event subscriptions.
**Rationale**: 
- Simpler implementation; doesn't require persistent connections
- 30-second interval provides good balance between staleness and performance
- Works reliably across network conditions and service implementations
**Alternatives Considered**: 
- Event-driven subscriptions: Higher real-time accuracy but more complex, requires bilateral connection setup
- On-demand checks: Would miss failures occurring between user actions

### 2. Centralized Status Context via React Context + Hooks
**Decision**: Implement status state as a React Context Provider with custom hooks for consumption.
**Rationale**:
- Allows any component to subscribe to status changes without prop drilling
- Centralized single source of truth prevents inconsistent state across UI
- Easy to test and mock for component testing
**Implementation Details**:
- Create `ConnectionStatusContext` and `useConnectionStatus()` hook
- Monitor periodically via `useEffect` in context provider
- Status shape: `{ openclaw: 'connected'|'disconnected'|'error', zalo: 'connected'|'disconnected'|'error', lastCheck: timestamp }`

### 3. Status Check Implementation via Gateway Client
**Decision**: Add status check methods to the existing gateway client rather than direct API calls.
**Rationale**:
- Centralizes connection logic with existing integration layer
- Easier to mock/test
- Future changes to API endpoints only need updates in gateway client
**Implementation**:
- `gateway.checkOpenclawStatus()` - returns success/error
- `gateway.checkZaloStatus()` - returns success/error
- Implement with lightweight health check endpoints or by attempting minimal operations

### 4. Recovery Workflows via Dialog System
**Decision**: Surface recovery options in modal dialogs with clear action steps.
**Rationale**:
- Interrupts user flow appropriately to communicate blockage
- Provides guided recovery steps without overwhelming UI
- Can be dismissed when recovery is beyond user's scope
**Recovery Options**:
- Re-configure integration (route to settings)
- Re-authenticate service
- Check documentation/troubleshooting
- Dismiss and proceed with degraded service (if applicable)

### 5. Graceful UI Degradation
**Decision**: Disable operations/features that depend on unavailable services.
**Rationale**:
- Prevents cascading errors and confusing UX
- Clear visual feedback about what's unavailable and why
- Improves error messages by having context

## Risks / Trade-offs

[Status Staleness] → Polling every 30 seconds means up to 30s delay before UI reflects failures. Mitigated by: explicit "Check Now" button for immediate verification, users can trigger on-demand checks before critical operations.

[Performance Impact] → Periodic requests add network load. Mitigated by: lightweight health checks (not full data fetches), skipping checks if browser is backgrounded using Page Visibility API.

[False Negatives] → Intermittent network issues may appear as disconnects then recover. Mitigated by: implementing "grace period" (2-3 consecutive failures before marking disconnected to reduce flapping), logging for debugging.

[Configuration State Mismatch] → Status "connected" doesn't guarantee config is valid. Mitigated by: status checks perform basic connectivity; settings pages perform full validation when user edits configuration.

## Migration Plan

**Phase 1: Infrastructure**
- Add status check methods to gateway client
- Implement `ConnectionStatusContext` and `useConnectionStatus` hook
- Add status monitor service that runs on app initialization

**Phase 2: UI Integration**
- Add status indicators to dashboard header/shell
- Add recovery dialogs to onboarding flow
- Integrate status checks into existing error boundaries

**Phase 3: Graceful Degradation**
- Audit components that depend on openclaw/zalo
- Disable/gray out features when services unavailable
- Update error messages to reference connection status

**Rollback**: Feature can be disabled by stopping the status monitor service in app initialization. Existing UI remains functional without status indicators.

## Open Questions

1. Should status checks run on a background timer continuously, or only when dashboard/onboarding is actively displayed? (Suggest: continuously, but honor Page Visibility API to reduce idle load)
2. What constitutes a "healthy" status check? (Simple ping endpoint vs. actual operation test?)
3. Should status failures block page navigation, or just surface as warnings?
