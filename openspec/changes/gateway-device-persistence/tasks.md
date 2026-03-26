## 1. Integration Setup (Already Complete ✅)

- [x] 1.1 Create device-storage.ts with DeviceStorage class
- [x] 1.2 Create device-identity.ts with environment binding layer
- [x] 1.3 Add ESLint suppression comments for require() in storage layer
- [x] 1.4 Verify TypeScript compilation (no errors)
- [x] 1.5 Verify Next.js build (clean compile)

## 2. Storage API Implementation (Already Complete ✅)

- [x] 2.1 Implement deviceStorage.load() for retrieval from all backends
- [x] 2.2 Implement deviceStorage.save() with multi-backend support
- [x] 2.3 Implement deviceStorage.getOrInit() for first-use initialization
- [x] 2.4 Implement deviceStorage.updateToken() for cached token persistence
- [x] 2.5 Implement deviceStorage.getNextRequestId() with counter increment
- [x] 2.6 Implement deviceStorage.clear() for logout/reset
- [x] 2.7 Add localStorage backend (browser)
- [x] 2.8 Add file system backend (Node.js)
- [x] 2.9 Add in-memory cache layer

## 3. Device Identity API Implementation (Already Complete ✅)

- [x] 3.1 Implement loadDeviceIdentityFromEnv() to read env vars
- [x] 3.2 Implement getOrInitDeviceState() with env + storage merge
- [x] 3.3 Implement getNextRequestId() wrapper
- [x] 3.4 Implement buildSignaturePayload() for v2 format
- [x] 3.5 Implement fromBase64Url() decoder
- [x] 3.6 Implement toBase64Url() encoder
- [x] 3.7 Implement updatePersistedDeviceToken() for token caching
- [x] 3.8 Implement clearDeviceState() for logout

## 4. GatewayClient Integration (Pending)

- [ ] 4.1 Import device-identity utilities in client.ts
- [ ] 4.2 Update handleChallenge() to call getOrInitDeviceState()
- [ ] 4.3 Update handleChallenge() to use getNextRequestId() instead of this.requestId++
- [ ] 4.4 Update connect handshake to use Ed25519 signing from device-identity
- [ ] 4.5 Update handleResponse() for successful connect to call updatePersistedDeviceToken()
- [ ] 4.6 Test that first connection uses env vars, second uses cached device
- [ ] 4.7 Verify request IDs are persisted and don't collide

## 5. Testing & Validation (Pending)

- [ ] 5.1 Update integration test to use getOrInitDeviceState()
- [ ] 5.2 Add unit tests for fromBase64Url/toBase64Url round-trip
- [ ] 5.3 Add unit tests for buildSignaturePayload() v2 format
- [ ] 5.4 Add integration test for device persistence across app restart (mock storage)
- [ ] 5.5 Add test for deviceToken cache on successful connect
- [ ] 5.6 Add test for request ID counter persistence
- [ ] 5.7 Verify all tests pass with real gateway

## 6. Documentation (Pending)

- [ ] 6.1 Complete DEVICE_STORAGE_README.md with examples (already drafted)
- [ ] 6.2 Add JSDoc comments to all exported functions
- [ ] 6.3 Document environment variable requirements in README.md
- [ ] 6.4 Create .env.example template with required vars
- [ ] 6.5 Document storage file format and versioning strategy

## 7. Cleanup & Finalization

- [ ] 7.1 Remove tmp-handshake-probe.js (no longer needed for production)
- [ ] 7.2 Remove .tmp-openclaw-device-auth.json (test fixture)
- [ ] 7.3 Verify no console.log or debug statements in production code
- [ ] 7.4 Final build verification (Next.js clean, no TypeScript errors, ESLint passed)
- [ ] 7.5 Final integration test run against real gateway
