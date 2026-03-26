# Device Identity & State Storage

## Overview

Persistent storage for device identity and request state to solve these problems in the production app:

- **Pairing churn**: Device credentials persisted → reuse approved device instead of creating new requests
- **Request ID collisions**: Request ID counter persisted → unique IDs across sessions
- **Re-authentication loops**: DeviceToken cached → avoid pairing approval on every restart

## How It Works

### Storage Layers

1. **In-memory cache** (fastest, first check)
2. **Browser localStorage** (client-side persistence, `zaloclaw.device` key)
3. **File system** (Node.js/server, `.tmp-zaloclaw-device.json` in project root)

The system automatically uses the appropriate layer based on environment.

## Modules

### `device-storage.ts`

Low-level persistent storage for device state:

```typescript
import { deviceStorage } from "@/lib/gateway/device-storage";

// Load existing state
const state = deviceStorage.load();

// Save state
deviceStorage.save({
  deviceId: "...",
  publicKey: "...",
  privateKey: "...",
  deviceToken: "...",
  requestIdCounter: 42,
  updatedAt: Date.now(),
});

// Initialize or update for new device
const state = deviceStorage.getOrInit(deviceId, publicKey, privateKey);

// Get next unique request ID (increments counter)
const id = deviceStorage.getNextRequestId();

// Update token after successful connect
deviceStorage.updateToken(newDeviceToken);

// Clear all state (logout/reset)
deviceStorage.clear();
```

### `device-identity.ts`

High-level device management with environment integration:

```typescript
import {
  loadDeviceIdentityFromEnv,
  getOrInitDeviceState,
  getNextRequestId,
  buildSignaturePayload,
  fromBase64Url,
  toBase64Url,
  updatePersistedDeviceToken,
  clearDeviceState,
} from "@/lib/gateway/device-identity";

// Load credentials from environment
const identity = loadDeviceIdentityFromEnv();

// Get device state (auto-initializes from env + storage)
const state = getOrInitDeviceState();
// → Returns: { deviceId, publicKey, privateKey, deviceToken?, requestIdCounter, updatedAt }

// Get next request ID for RPC
const id = getNextRequestId();

// Build signature payload for connect handshake
const payload = buildSignaturePayload({
  deviceId: state.deviceId,
  clientId: "...",
  clientMode: "browser",
  role: "operator",
  scopes: ["models:read"],
  signedAt: Date.now(),
  token: gatewayToken,
  nonce: "...",
});

// Handle key encoding/decoding
const keyBytes = fromBase64Url(state.privateKey);
const encoded = toBase64Url(keyBytes);

// Persist deviceToken after successful connect
updatePersistedDeviceToken(responseDeviceToken);

// Clear on logout
clearDeviceState();
```

## Environment Variables

Required for device initialization:

```bash
DEVICE_ID=<uuid>                          # Device identifier
DEVICE_PUBLIC_KEY=<base64url>             # Ed25519 public key
DEVICE_PRIVATE_KEY=<base64url>            # Ed25519 private key
DEVICE_TOKEN=<token>                      # (Optional) Cached device token
```

## Integration in GatewayClient

When implementing the production handshake:

```typescript
import { getOrInitDeviceState, getNextRequestId, buildSignaturePayload } from "@/lib/gateway/device-identity";
import { signAsync } from "@noble/ed25519";

// In handleChallenge event:
const state = getOrInitDeviceState();
const requestId = getNextRequestId();
const nonce = state.currentNonce;

const signature = await signAsync(
  new TextEncoder().encode(buildSignaturePayload({
    deviceId: state.deviceId,
    clientId: this.clientId,
    clientMode: "browser",
    role: "operator",
    scopes: ["models:read", "models:write"],
    signedAt: Date.now(),
    token: gatewayToken,
    nonce,
  })),
  fromBase64Url(state.privateKey)
);

this.ws.send(JSON.stringify({
  type: "req",
  id: requestId,
  method: "connect",
  params: {
    minProtocol: 3,
    maxProtocol: 3,
    client: { id: this.clientId, version, platform, mode, instanceId },
    role: "operator",
    scopes: ["models:read", "models:write"],
    device: {
      id: state.deviceId,
      publicKey: state.publicKey,
      signature: toBase64Url(signature),
      signedAt: Date.now(),
      nonce,
    },
    auth: {
      token: gatewayToken,
      deviceToken: state.deviceToken,
    },
  },
}));

// After successful connect (res.ok === true):
if (response.payload?.deviceToken) {
  updatePersistedDeviceToken(response.payload.deviceToken);
}
```

## Benefits

✅ Device reusable across app restarts (no re-pairing needed)  
✅ Request IDs never collide (counter persisted)  
✅ DeviceToken cached (faster reconnects)  
✅ Works client-side (browser) and server-side (Node.js)  
✅ Automatic environment binding (env vars + storage)
