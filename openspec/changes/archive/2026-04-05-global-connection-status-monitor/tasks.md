## 1. Foundation and Infrastructure

- [x] 1.1 Create ConnectionStatusContext and useConnectionStatus hook in `lib/status/`
- [x] 1.2 Define status data structure (openclaw, zalo, timestamp, errors)
- [x] 1.3 Add status check methods to gateway client (checkOpenclawStatus, checkZaloStatus)
- [x] 1.4 Implement getStatus() method to access cached status in gateway client
- [x] 1.5 Create status monitor service in `lib/status/status-monitor.ts`

## 2. Status Checking Logic

- [x] 2.1 Implement periodic polling with 30-second interval
- [x] 2.2 Add grace period logic (consecutive failure threshold = 2)
- [x] 2.3 Add Page Visibility API support to pause checks when page is hidden
- [x] 2.4 Implement error handling and logging for status checks
- [x] 2.5 Add timestamp tracking for each status check
- [x] 2.6 Implement debouncing/deduplication to avoid rapid repeated checks

## 3. React Integration and State Management

- [x] 3.1 Create ConnectionStatusProvider component wrapper
- [x] 3.2 Wire up status monitor to run on app initialization in layout
- [x] 3.3 Implement status context subscriptions to notify components of changes
- [x] 3.4 Add cleanup/teardown for status monitor on app unmount
- [ ] 3.5 Test context availability across component tree

## 4. Status Indicator UI Components

- [x] 4.1 Create StatusIndicator component with connected/disconnected/checking states
- [x] 4.2 Add color coding (green/red/gray) based on status
- [x] 4.3 Implement hover tooltip showing service name and last check time
- [x] 4.4 Create StatusBar component for dashboard header
- [x] 4.5 Add "Check Now" refresh button with loading state indicator

## 5. Recovery UI Components

- [x] 5.1 Create RecoveryDialog component for displaying recovery options
- [x] 5.2 Implement "Reconfigure" action (navigate to settings)
- [x] 5.3 Implement "Re-authenticate" action (trigger auth flow)
- [x] 5.4 Implement "View Documentation" action (open external docs)
- [x] 5.5 Implement "Dismiss" action (close dialog)
- [x] 5.6 Add automatic display logic when persistent disconnection detected

## 6. Dashboard Shell Integration

- [x] 6.1 Add status indicators to dashboard header/shell
- [x] 6.2 Integrate recovery dialog trigger on disconnection
- [x] 6.3 Add manual refresh button for immediate status checks
- [ ] 6.4 Update shell styling for status indicators
- [ ] 6.5 Test status indicator behavior in dashboard

## 7. Onboarding Wizard Integration

- [x] 7.1 Add connection check after service configuration steps
- [x] 7.2 Display status indicators in onboarding flow
- [x] 7.3 Implement configuration validation with recovery workflow
- [x] 7.4 Add "Retry" option for failed connection checks
- [x] 7.5 Add "Review Configuration" option in recovery
- [x] 7.6 Implement skip/incomplete marking for unconfigured services
- [x] 7.7 Prevent onboarding completion with disconnected critical services

## 8. Graceful Feature Degradation

- [x] 8.1 Identify components that depend on openclaw/zalo
- [x] 8.2 Add conditional rendering based on connection status
- [x] 8.3 Disable interactions on unavailable services
- [x] 8.4 Add tooltip explanations for disabled features
- [ ] 8.5 Test degraded state scenarios

## 9. Settings and Configuration Enhancements

- [x] 9.1 Add quick reconfigure links in settings
- [x] 9.2 Highlight services with connection issues in settings UI
- [x] 9.3 Show last known status and check time in settings
- [x] 9.4 Add manual test connection button in settings

## 10. Testing

- [x] 10.1 Write unit tests for ConnectionStatusContext
- [x] 10.2 Write unit tests for status monitor service
- [ ] 10.3 Write unit tests for StatusIndicator component
- [ ] 10.4 Write unit tests for RecoveryDialog component
- [ ] 10.5 Write integration tests for dashboard status display
- [ ] 10.6 Write integration tests for onboarding recovery flow
- [x] 10.7 Test Page Visibility API pause/resume behavior
- [x] 10.8 Test grace period and consecutive failure logic

## 11. Localization

- [x] 11.1 Add translation keys for status labels (connected, disconnected, checking)
- [x] 11.2 Add translation keys for recovery dialog options
- [x] 11.3 Add translation keys for tooltip/help text
- [x] 11.4 Add translation keys for onboarding status messages
- [ ] 11.5 Test localization in onboarding and dashboard

## 12. Documentation and Polish

- [ ] 12.1 Add JSDoc comments to status context and hooks
- [ ] 12.2 Document status monitor configuration options
- [ ] 12.3 Create troubleshooting guide for connection issues
- [ ] 12.4 Add error logging/monitoring for production debugging
- [ ] 12.5 Peer review of implementation
- [ ] 12.6 Performance testing with rapid status transitions
- [ ] 12.7 Accessibility testing (ARIA labels, keyboard navigation)
