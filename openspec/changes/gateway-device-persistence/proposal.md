## Why

The OpenClaw gateway requires device identity and per-session request state management to function correctly in production. Currently, device credentials are held only in memory, causing **pairing churn** (repeatedly requesting approval for the same device), **request ID collisions** (counter resets on app restart), and **re-authentication loops** (deviceToken is not preserved). This creates friction for users and makes testing inefficient.

We need persistent device storage to ensure:
1. Device credentials and approval tokens survive app restarts (eliminate pairing churn)
2. Request IDs are globally unique across sessions (prevent RPC conflicts)
3. WebSocket connection state is recoverable without re-pairing

## What Changes

### New Modules
- **`device-storage.ts`**: Low-level persistence layer with automatic multi-backend support (in-memory cache → browser localStorage → Node.js file system)
- **`device-identity.ts`**: High-level device management layer that binds environment variables (`DEVICE_ID`, `DEVICE_PUBLIC_KEY`, `DEVICE_PRIVATE_KEY`, `DEVICE_TOKEN`) to persistent storage

### New APIs
- `deviceStorage.load()` / `.save()` / `.getOrInit()` — manage raw device state
- `getOrInitDeviceState()` — singleton pattern for app lifetime
- `getNextRequestId()` — allocate unique request IDs
- `buildSignaturePayload()` — construct v2 signature format for Ed25519 signing
- `updatePersistedDeviceToken()` — cache token after successful handshake
- Key encoding: `fromBase64Url()` / `toBase64Url()`

### Integration Path
- `src/lib/gateway/client.ts` will import and use these modules in the connect handshake flow
- Device state automatically initialized from environment on first use

## Capabilities

### New Capabilities
- `device-identity-persistence`: Persist device credentials and authentication tokens across sessions
- `request-id-sequencing`: Globally unique request IDs using persisted counter
- `device-storage-backends`: Automatic storage backend selection (browser/Node.js)

### Modified Capabilities
- (None: gateway-client implementation remains internal; no spec-level API changes for consumers yet)

## Impact

- **Code**: New files in `src/lib/gateway/`, imports in existing `client.ts`
- **APIs**: No breaking changes; new internal utilities
- **Dependencies**: None (existing `@noble/ed25519`, `ws` packages already in use)
- **Environment**: Requires `DEVICE_ID`, `DEVICE_PUBLIC_KEY`, `DEVICE_PRIVATE_KEY` env vars (optional `DEVICE_TOKEN`)
- **Storage**: Uses `.tmp-zaloclaw-device.json` file on Node.js, `localStorage["zaloclaw.device"]` in browser
- **Build Status**: ✅ Clean (TypeScript, ESLint, Next.js all passing)
