/**
 * Device identity management for OpenClaw gateway authentication.
 *
 * Loads device credentials from environment variables and manages
 * signing, key encoding/decoding, and device state persistence.
 */

import { deviceStorage, type DeviceState } from "./device-storage";

export interface DeviceIdentity {
  id: string;
  publicKey: string;
  privateKey: string;
  deviceToken?: string;
}

/**
 * Load device identity from environment variables.
 * Expected vars: DEVICE_ID, DEVICE_PUBLIC_KEY, DEVICE_PRIVATE_KEY, DEVICE_TOKEN (optional)
 */
export function loadDeviceIdentityFromEnv(): DeviceIdentity | null {
  const deviceId = process.env.DEVICE_ID;
  const publicKey = process.env.DEVICE_PUBLIC_KEY;
  const privateKey = process.env.DEVICE_PRIVATE_KEY;

  if (!deviceId || !publicKey || !privateKey) {
    return null;
  }

  return {
    id: deviceId,
    publicKey,
    privateKey,
    deviceToken: process.env.DEVICE_TOKEN,
  };
}

/**
 * Get or initialize device state from environment and storage.
 * First tries storage (for request ID continuity), then env (for credentials).
 * Merges both sources to ensure non-breaking changes to device identity.
 */
export function getOrInitDeviceState(): DeviceState {
  const envIdentity = loadDeviceIdentityFromEnv();

  if (!envIdentity) {
    throw new Error(
      "Device identity not found. Set DEVICE_ID, DEVICE_PUBLIC_KEY, DEVICE_PRIVATE_KEY environment variables."
    );
  }

  const state = deviceStorage.getOrInit(
    envIdentity.id,
    envIdentity.publicKey,
    envIdentity.privateKey
  );

  // Update token from env if provided and different
  if (envIdentity.deviceToken && envIdentity.deviceToken !== state.deviceToken) {
    state.deviceToken = envIdentity.deviceToken;
    deviceStorage.save(state);
  }

  return state;
}

/**
 * Get next request ID from persistent state.
 * Ensures request IDs don't collide across sessions.
 */
export function getNextRequestId(): number {
  return deviceStorage.getNextRequestId();
}

/**
 * Convert base64url-encoded string to Uint8Array.
 */
export function fromBase64Url(str: string): Uint8Array {
  return new Uint8Array(
    Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/"), "base64")
  );
}

/**
 * Convert Uint8Array to base64url-encoded string.
 */
export function toBase64Url(buffer: Uint8Array): string {
  return Buffer.from(buffer)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Build v2 signature payload for device authentication.
 *
 * Format: "v2|<deviceId>|<clientId>|<clientMode>|<role>|<scopes>|<signedAt>|<token>|<nonce>"
 */
export function buildSignaturePayload(params: {
  deviceId: string;
  clientId: string;
  clientMode: string;
  role: string;
  scopes: string[];
  signedAt: number;
  token: string;
  nonce: string;
}): string {
  const scopesStr = params.scopes.join(",");
  return `v2|${params.deviceId}|${params.clientId}|${params.clientMode}|${params.role}|${scopesStr}|${params.signedAt}|${params.token}|${params.nonce}`;
}

/**
 * Update persisted device token after successful connect handshake.
 */
export function updatePersistedDeviceToken(deviceToken: string): void {
  deviceStorage.updateToken(deviceToken);
}

/**
 * Clear all persisted device state (for logout/reset).
 */
export function clearDeviceState(): void {
  deviceStorage.clear();
}
