## Architecture

### Storage Layer (device-storage.ts)
```
┌─────────────────────────────────────────┐
│   DeviceStorage (Singleton)             │
├─────────────────────────────────────────┤
│ Cache Layer (in-memory)                 │
│ ├─ deviceState: DeviceState | null      │
│ └─ load/save/clear operations           │
├─────────────────────────────────────────┤
│ Persistence Layer (multi-backend)       │
│ ├─ Browser: localStorage["zaloclaw.device"]
│ └─ Node.js: .tmp-zaloclaw-device.json   │
└─────────────────────────────────────────┘
```

### Identity Layer (device-identity.ts)
```
Environment Variables
  ↓
loadDeviceIdentityFromEnv()
  ↓
getOrInitDeviceState()
  ↓ (merges env + storage)
DeviceState { id, publicKey, privateKey, deviceToken, requestIdCounter, updatedAt }
  ↓
Used by GatewayClient for:
  - getNextRequestId() (for RPC frames)
  - buildSignaturePayload() (for Ed25519 signing)
  - updatePersistedDeviceToken() (after connect success)
```

## Implementation Details

### DeviceState Structure
```typescript
interface DeviceState {
  deviceId: string;              // UUID from approved device
  publicKey: string;             // base64url Ed25519 public key
  privateKey: string;            // base64url Ed25519 private key
  deviceToken?: string;          // JWT/token from gateway
  requestIdCounter: number;      // Current value for next request ID
  updatedAt: number;             // Timestamp of last update
}
```

### Storage File Format
**Browser**: `localStorage["zaloclaw.device"]` = JSON stringified DeviceState
**Node.js**: `.tmp-zaloclaw-device.json` = Pretty-printed DeviceState JSON

### GatewayClient Integration Points

1. **In `handleChallenge()` event handler**:
   ```typescript
   const state = getOrInitDeviceState();
   const requestId = getNextRequestId();
   // Use state.deviceId, state.publicKey, state.privateKey for signing
   ```

2. **After successful connect response (res.ok=true)**:
   ```typescript
   if (response.payload?.deviceToken) {
     updatePersistedDeviceToken(response.payload.deviceToken);
   }
   ```

3. **For Ed25519 signature**:
   ```typescript
   const payload = buildSignaturePayload({...});
   const signature = await signAsync(
     new TextEncoder().encode(payload),
     fromBase64Url(state.privateKey)
   );
   ```

## Environment Configuration

Required environment variables:
```bash
DEVICE_ID=134fc59f5c49e88ba6df0f4f1cbf5f81fe82bbd0ad69e8fcf22a269212e7587e
DEVICE_PUBLIC_KEY=... (base64url)
DEVICE_PRIVATE_KEY=... (base64url)
DEVICE_TOKEN=... (optional, auto-persisted after connect)
```

## Error Handling

- Missing device env vars → throw Error with clear message about required env vars
- Corrupted storage file → log warning, return null (reinitialize)
- Storage write failures → log warning, continue with in-memory cache
- Uninitialized device state access → throw Error ("Device state not initialized")

## Testing

- Unit tests in device-identity.ts for:
  - `fromBase64Url()` / `toBase64Url()` round-trip
  - `buildSignaturePayload()` format correctness
  - `getOrInitDeviceState()` initialization logic

- Integration tests update to use `getNextRequestId()` for pseudo-unique IDs (avoid collisions during test runs)

- Device storage persistence tests:
  - Load/save/clear operations
  - Multi-backend fallback (localStorage → file system)
  - Migration from old storage format (if applicable)
