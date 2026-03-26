## 1. Diagnostics API Layer

- [ ] 1.1 Create gateway-diagnostics.ts with DiagnosticsManager singleton
- [ ] 1.2 Add event listeners to device-storage.ts for state changes
- [ ] 1.3 Add diagnostic hooks to GatewayClient for WS status events
- [ ] 1.4 Implement DiagnosticsManager.updateDeviceState()
- [ ] 1.5 Implement DiagnosticsManager.updateWsStatus()
- [ ] 1.6 Implement DiagnosticsManager.logRpcCall() with last-5 history
- [ ] 1.7 Implement DiagnosticsManager.getStatus() for console API
- [ ] 1.8 Add error handling for RPC call tracking
- [ ] 1.9 Verify zero performance impact with and without diagnostics enabled

## 2. Browser Console API

- [ ] 2.1 Create diagnostics-console-api.ts for window.gatewayDiagnostics
- [ ] 2.2 Implement process.env.NODE_ENV === 'development' check
- [ ] 2.3 Expose window.gatewayDiagnostics.check()
- [ ] 2.4 Expose window.gatewayDiagnostics.clear()
- [ ] 2.5 Expose window.gatewayDiagnostics.reload()
- [ ] 2.6 Test console API in browser dev tools
- [ ] 2.7 Verify API is not present in production builds

## 3. React Component Implementation

- [ ] 3.1 Create GatewayStatusBadge.tsx component
- [ ] 3.2 Implement badge styling (compact, color-coded)
- [ ] 3.3 Add click handler to expand diagnostics panel
- [ ] 3.4 Create GatewayDiagnosticsPanel.tsx component (expandable)
- [ ] 3.5 Implement device section (ID, keys, status)
- [ ] 3.6 Implement authentication section (token status, request counter)
- [ ] 3.7 Implement connection section (WS status, error messages)
- [ ] 3.8 Implement environment section (var checklist)
- [ ] 3.9 Implement RPC history section (last 5 calls)
- [ ] 3.10 Add close button and dismiss functionality
- [ ] 3.11 Use React.memo to optimize re-renders
- [ ] 3.12 Add debouncing for rapid state updates (max 1 per 100ms)

## 4. Data Binding & Real-time Updates

- [ ] 4.1 Create useGatewayDiagnostics hook for state subscription
- [ ] 4.2 Add useEffect to subscribe to device storage changes
- [ ] 4.3 Add useEffect to subscribe to GatewayClient WS status
- [ ] 4.4 Add useEffect to check environment variables on mount
- [ ] 4.5 Implement state updates with batching/debouncing
- [ ] 4.6 Test that panel updates within 100ms of state change
- [ ] 4.7 Verify no memory leaks from repeated mount/unmount

## 5. Debug Mode URL Parameter

- [ ] 5.1 Create enableDiagnosticsFromUrl() utility in app root
- [ ] 5.2 Check for ?debug=gateway query parameter
- [ ] 5.3 Conditionally render GatewayStatusBadge if debug=gateway
- [ ] 5.4 Use process.env.NODE_ENV to ensure only in development
- [ ] 5.5 Test debug mode works at localhost:3000/?debug=gateway
- [ ] 5.6 Verify hidden by default when param is not present

## 6. Styling & UI Polish

- [ ] 6.1 Create tailwind styles for status badge (compact, responsive)
- [ ] 6.2 Create tailwind styles for diagnostics panel (readable layout)
- [ ] 6.3 Add color coding: green (OK), yellow (connecting/pending), red (error)
- [ ] 6.4 Add icons for each status (checkmark, X, hourglass)
- [ ] 6.5 Make panel draggable or repositionable (optional, low priority)
- [ ] 6.6 Ensure panel doesn't obstruct app UI
- [ ] 6.7 Test responsive layout on mobile/tablet

## 7. Integration & Testing

- [ ] 7.1 Integrate GatewayStatusBadge into app layout/root
- [ ] 7.2 Test with real GatewayClient during connect flow
- [ ] 7.3 Test badge updates as WS status changes
- [ ] 7.4 Test panel displays correct device ID from storage
- [ ] 7.5 Test RPC call tracking logs methods and latencies
- [ ] 7.6 Test environment checklist correctly identifies missing vars
- [ ] 7.7 Test deviceToken expiration estimate updates
- [ ] 7.8 Test request ID counter increments with each RPC

## 8. Performance Optimization

- [ ] 8.1 Verify diagnostics adds <10ms to app startup time
- [ ] 8.2 Verify panel updates don't block main thread
- [ ] 8.3 Profile memory usage with 100 RPC calls logged
- [ ] 8.4 Verify no performance regression when debug=gateway is NOT set
- [ ] 8.5 Use Chrome DevTools Performance tab to validate

## 9. Production Safety

- [ ] 9.1 Verify diagnostics code is NOT included in production builds
- [ ] 9.2 Build with NODE_ENV=production and confirm window.gatewayDiagnostics undefined
- [ ] 9.3 Verify console API doesn't expose sensitive data (private keys, raw tokens)
- [ ] 9.4 Add security comment about debug-only availability
- [ ] 9.5 Verify ?debug=gateway ignored in production

## 10. Documentation

- [ ] 10.1 Create GATEWAY_DIAGNOSTICS_README.md
- [ ] 10.2 Document ?debug=gateway URL usage
- [ ] 10.3 Document window.gatewayDiagnostics console API
- [ ] 10.4 Add examples of debugging common issues
- [ ] 10.5 Update main README with troubleshooting section

## 11. Cleanup & Finalization

- [ ] 11.1 Final build verification (dev and production)
- [ ] 11.2 Test in Chrome, Firefox, Safari
- [ ] 11.3 Run full test suite (npm test)
- [ ] 11.4 Verify no TypeScript errors or ESLint warnings
- [ ] 11.5 Final UX review of panel layout and responsiveness
