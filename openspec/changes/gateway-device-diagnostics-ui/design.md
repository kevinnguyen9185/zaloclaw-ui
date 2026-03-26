## Architecture

### Diagnostics UI System

```
GatewayDiagnosticsPanel.tsx (React Component)
  │
  ├─ ListenToDeviceStorage()    (useEffect subscribed to storage changes)
  ├─ ListenToGatewayClient()    (useEffect subscribed to WS state)
  └─ ListenToEnvironment()      (useEffect checks env vars on mount)
  │
  ├─ State: { device, token, wsStatus, env, lastRpcCalls }
  │
  └─ Render:
      ├─ Device ID Badge (green/red with tooltip)
      ├─ Token Status (cached? expires in X hours?)
      ├─ Request ID Counter (current, next)
      ├─ WS Connection Status (connected/disconnecting/reconnecting/error with reason)
      ├─ Environment Checklist (required vars present?)
      └─ Recent RPC History (last 5 calls with status/latency)
```

### Access Methods

#### 1. **Debug URL Mode** (Hidden by Default)
```typescript
// In app layout or root layout component:
if (new URLSearchParams(window.location.search).get('debug') === 'gateway') {
  <GatewayDiagnosticsPanel />
}
```
Access: `https://localhost:3000/?debug=gateway`

#### 2. **Console API** (Always Available)
```typescript
// Expose to window during development
if (process.env.NODE_ENV === 'development') {
  window.gatewayDiagnostics = {
    check: () => diagnosticsApi.getStatus(),
    clear: () => deviceStorage.clear(),
    reload: () => window.location.reload(),
  };
}

// Usage in browser console:
window.gatewayDiagnostics.check()
// Returns: { device, token, wsStatus, env, valid: boolean }
```

#### 3. **Status Badge Component** (Optional)
```typescript
// Small corner badge that shows connection state
// Green with checkmark: Connected & Authenticated
// Yellow: Connecting (pulsing)
// Red: Disconnected with reason
// Click to expand diagnostics panel
<GatewayStatusBadge />
```

### Real-time State Management

```typescript
interface DiagnosticsState {
  device: {
    id: string | null;
    hasPrivateKey: boolean;
    hasPublicKey: boolean;
  };
  token: {
    cached: boolean;
    expiresInMs?: number;  // estimated
  };
  requestIdCounter: {
    current: number;
    next: number;
  };
  wsStatus: {
    connected: boolean;
    authenticated: boolean;
    lastError?: string;
    reconnecting: boolean;
  };
  environment: {
    DEVICE_ID: boolean;
    DEVICE_PUBLIC_KEY: boolean;
    DEVICE_PRIVATE_KEY: boolean;
    DEVICE_TOKEN: boolean;
  };
  recentRpcCalls: Array<{
    id: number;
    method: string;
    status: 'pending' | 'success' | 'error';
    error?: string;
    latencyMs?: number;
  }>;
}
```

## Implementation Details

### Updates from Device Storage
- Add event emitter to device-storage.ts:
  ```typescript
  deviceStorage.on('change', (state) => {
    diagnosticsApi.updateDeviceState(state);
  });
  ```

### Updates from GatewayClient
- Add diagnostic hooks to GatewayClient:
  ```typescript
  // Emit on status change
  this.addDiagnosticListener('wsStatus', (status) => {
    diagnosticsApi.updateWsStatus(status);
  });
  ```

### RPC Call Tracking
- Intercept RPC calls in GatewayClient.send():
  ```typescript
  const startTime = performance.now();
  return this.send(method, params).then(
    (result) => {
      diagnosticsApi.logRpcCall(id, method, 'success', performance.now() - startTime);
      return result;
    },
    (error) => {
      diagnosticsApi.logRpcCall(id, method, 'error', performance.now() - startTime, error.message);
      throw error;
    }
  );
  ```

## UI Layout

### Compact Mode (Status Badge)
```
┌─ 🟢 Connected ─┐
│ Tap to expand │
└────────────────┘
```

### Expanded Panel
```
┌────────────────────────────────────────┐
│     Gateway Diagnostics                │ ✕
├────────────────────────────────────────┤
│ Device                                  │
│  ✓ ID: 134fc59f5c49e88ba6df...        │
│  ✓ Private Key: Loaded                  │
│  ✓ Public Key: Loaded                   │
│                                         │
│ Authentication                          │
│  ✓ Device Token: Cached (4h remaining) │
│  ✓ Request Counter: 42 → 43 (next)     │
│                                         │
│ Connection                              │
│  🟢 Connected & Authenticated           │
│  ↻ Last reconnect: 2m ago               │
│                                         │
│ Environment                             │
│  ✓ DEVICE_ID                            │
│  ✓ DEVICE_PUBLIC_KEY                    │
│  ✓ DEVICE_PRIVATE_KEY                   │
│  ✗ DEVICE_TOKEN (auto-cached on connect)
│                                         │
│ Recent RPC Calls                        │
│  1. models.list (success, 245ms)        │
│  2. models.get (success, 128ms)         │
│  3. devices.list (pending...)           │
│                                         │
│ [🔄 Refresh] [🗑️ Clear State]           │
└────────────────────────────────────────┘
```

## Performance Considerations

- Update frequency: Only on actual state changes (debounced)
- Storage subscribers: Single global listener per subsystem
- RPC history: Keep only last 5 calls in memory
- Rendering: Use React.memo to prevent unnecessary re-renders
- CSS: Minimalist, no animations unless user prefers motion

## Security & Privacy

- Diagnostics panel hidden in production builds by default
- Never expose private key material in UI (only show "Loaded"/"Not Loaded")
- DeviceToken shown only as "Cached" (not the actual token)
- Logs cleared on logout/device reset
- Debug mode requires explicit URL param (not discoverable)
