# OpenSpec Changes - Complete Overview

## Summary

✅ **Both changes are now fully documented and ready for implementation**

Two related OpenSpec changes have been created to enhance the OpenClaw gateway integration:

1. **gateway-device-persistence** — Device identity and state storage (foundation)
2. **gateway-device-diagnostics-ui** — Real-time diagnostics UI (sub-feature)

---

## Change 1: Gateway Device Persistence

### Location
`openspec/changes/gateway-device-persistence/`

### Status
✅ 4/4 artifacts complete — Ready for implementation

### What It Is
Persistent storage system for device credentials and authentication state, eliminating:
- Pairing churn (device reused across app restarts)
- Request ID collisions (counter persisted globally)
- Re-authentication loops (device token cached)

### Artifacts

| File | Purpose | Link |
|------|---------|------|
| proposal.md | Problem statement & capabilities | 45 lines |
| design.md | Architecture & integration points | 106 lines |
| specs/spec.md | Requirements with test scenarios | 91 lines |
| tasks.md | Implementation roadmap | 66 lines |

### Key Implementation Files (Already Created)
- `src/lib/gateway/device-storage.ts` — Low-level persistence layer
- `src/lib/gateway/device-identity.ts` — High-level device management
- `src/lib/gateway/DEVICE_STORAGE_README.md` — Usage documentation

### Pending Integration Tasks (Section 4+ of tasks.md)
- Update GatewayClient to use device-identity APIs
- Port Ed25519 handshake from validated probe
- Test request ID persistence and device caching

---

## Change 2: Gateway Device Diagnostics UI (Sub-Feature)

### Location
`openspec/changes/gateway-device-diagnostics-ui/`

### Status
✅ 4/4 artifacts complete — Ready for implementation

### What It Is
Real-time diagnostic panel showing:
- Device ID and key status
- Cached device token status
- Request ID counter
- WebSocket connection readiness
- Environment variable validation
- Recent RPC call history

### Access Methods
1. **Debug URL**: `?debug=gateway` (development only)
2. **Console API**: `window.gatewayDiagnostics.check()` (dev only)
3. **Status Badge**: Compact corner indicator (expandable)

### Artifacts

| File | Purpose | Link |
|------|---------|------|
| proposal.md | Use case & capabilities | 50 lines |
| design.md | Component architecture & layout | 190 lines |
| specs/spec.md | Requirements with test scenarios | 142 lines |
| tasks.md | Implementation roadmap | 108 lines |

### Pending Implementation (All 11 sections)
- Diagnostics API layer (tracking device/WS state)
- React components (status badge & expandable panel)
- Browser console API (`window.gatewayDiagnostics`)
- Real-time data binding to storage/client changes
- UI styling and responsiveness

---

## How to Use OpenSpec

### View Status
```bash
openspec status --change "gateway-device-persistence"
openspec status --change "gateway-device-diagnostics-ui"
```

### Start Implementation (Device Persistence)
```bash
openspec apply --change "gateway-device-persistence"
```
This uses the `/opsx:apply` skill to guide implementation of remaining tasks.

### Read Detailed Instructions
```bash
openspec instructions tasks --change "gateway-device-diagnostics-ui"
```

### Archive After Completion
```bash
openspec archive --change "gateway-device-persistence" --reason "Implementation complete"
```

---

## Recommended Implementation Order

### Phase 1: Device Persistence Integration (Highest Priority)
Integrate storage into production client (_Steps 4-5 of device-persistence/tasks.md_):
1. Import device-identity APIs into GatewayClient
2. Use `getOrInitDeviceState()` and `getNextRequestId()`
3. Implement Ed25519 signing and token persistence
4. Test with real gateway, confirm no pairing churn

**Time Estimate**: 2-3 hours  
**Blocker?**: Yes — app won't connect without this

### Phase 2: Device Diagnostics UI (Nice-to-Have)
Build diagnostic panel (_device-diagnostics-ui/tasks.md sections 1-11_):
1. Create diagnostics API layer (tracking device/WS/RPC state)
2. Build React components (badge + expandable panel)
3. Wire up real-time updates from storage/client
4. Add debug URL mode and console API
5. Style and test

**Time Estimate**: 4-6 hours  
**Blocker?**: No — app works without diagnostics, but helps debugging

---

## Files Created in This Session

### OpenSpec Structure
```
openspec/
├── changes/
│   ├── gateway-device-persistence/
│   │   ├── .openspec.yaml
│   │   ├── proposal.md
│   │   ├── design.md
│   │   ├── tasks.md
│   │   └── specs/spec.md
│   └── gateway-device-diagnostics-ui/
│       ├── .openspec.yaml
│       ├── proposal.md
│       ├── design.md
│       ├── tasks.md
│       └── specs/spec.md
```

### Implementation Files (Pre-Created)
```
src/lib/gateway/
├── device-storage.ts (206 lines, fully working)
├── device-identity.ts (192 lines, fully working)
└── DEVICE_STORAGE_README.md (usage guide)
```

---

## Environment Configuration Required

For the device-persistence feature to work, set these env vars:

```bash
DEVICE_ID=<uuid>                          # Device ID from approved device
DEVICE_PUBLIC_KEY=<base64url>             # Ed25519 public key
DEVICE_PRIVATE_KEY=<base64url>            # Ed25519 private key
DEVICE_TOKEN=<token>                      # (Optional, auto-persisted on connect)
```

For local testing, you can use values from `.tmp-zaloclaw-device-auth.json` from the previous probe session.

---

## Next Actions

1. ✅ Review this OpenSpec structure (`openspec/changes/`)
2. ⏭️  Apply device-persistence change (`openspec apply --change "gateway-device-persistence"`)
3. ⏭️  Implement pending integration tasks (Section 4-7)
4. ⏭️  Test end-to-end with real gateway
5. ⏭️  (Optional) Start diagnostics UI feature
6. ⏭️  Archive completed changes

---

## Questions?

- View full proposal/design/specs in OpenSpec files
- Use `openspec instructions <artifact> --change "<name>"` for detailed guidance
- Existing code in `src/lib/gateway/` shows what's already implemented (vs. pending)
