import { GATEWAY_URL } from "@/lib/env";
import { getPublicKeyAsync, signAsync, utils as edUtils } from "@noble/ed25519";
import { isZaloConnectedFromChannelsStatus } from "@/lib/gateway/zalo-status";
import type {
  ConnectionStatus,
  HelloEvent,
  JsonValue,
  RpcError,
} from "@/lib/gateway/types";

export const TOKEN_STORAGE_KEY = "zaloclaw.gateway.token";
export const DEVICE_ID_STORAGE_KEY = "zaloclaw.gateway.deviceId";
export const DEVICE_PUBLIC_KEY_STORAGE_KEY = "zaloclaw.gateway.devicePublicKey";
export const DEVICE_PRIVATE_KEY_STORAGE_KEY = "zaloclaw.gateway.devicePrivateKey";
export const DEVICE_TOKEN_STORAGE_KEY = "zaloclaw.gateway.deviceToken";
const RECONNECT_MAX_DELAY_MS = 30000;

type EventHandler = (payload: JsonValue | undefined) => void;
type StatusListener = (status: ConnectionStatus, error: string | null) => void;

type PendingRequest = {
  resolve: (value: JsonValue) => void;
  reject: (reason: Error | RpcError) => void;
};

export type ServiceCheckResult = {
  connected: boolean;
  error: string | null;
  checkedAt: number;
};

export type GatewayServiceStatusSnapshot = {
  openclaw: ServiceCheckResult | null;
  zalo: ServiceCheckResult | null;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export class GatewayClient {
  private ws: WebSocket | null = null;
  private status: ConnectionStatus = "idle";
  private errorMessage: string | null = null;
  private intentionalClose = false;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private requestId = 1;
  private currentNonce: string | null = null;

  private readonly eventHandlers = new Map<string, Set<EventHandler>>();
  private readonly pending = new Map<string, PendingRequest>();
  private readonly statusListeners = new Set<StatusListener>();

  private latestOpenclawStatus: ServiceCheckResult | null = null;
  private latestZaloStatus: ServiceCheckResult | null = null;

  private readonly url: string;

  constructor(url: string = GATEWAY_URL) {
    this.url = url;
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  getError(): string | null {
    return this.errorMessage;
  }

  getServiceStatus(): GatewayServiceStatusSnapshot {
    return {
      openclaw: this.latestOpenclawStatus,
      zalo: this.latestZaloStatus,
    };
  }

  async checkOpenclawStatus(timeoutMs: number = 5000): Promise<ServiceCheckResult> {
    const checkedAt = Date.now();

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      const disconnectedResult = {
        connected: false,
        error: "Gateway client is not connected",
        checkedAt,
      };
      this.latestOpenclawStatus = disconnectedResult;
      return disconnectedResult;
    }

    try {
      await this.send("sessions.list", { limit: 1 }, timeoutMs);
      const connectedResult = { connected: true, error: null, checkedAt };
      this.latestOpenclawStatus = connectedResult;
      return connectedResult;
    } catch (error) {
      const disconnectedResult = {
        connected: false,
        error: error instanceof Error ? error.message : "Failed to check openclaw status",
        checkedAt,
      };
      this.latestOpenclawStatus = disconnectedResult;
      return disconnectedResult;
    }
  }

  async checkZaloStatus(timeoutMs: number = 5000): Promise<ServiceCheckResult> {
    const checkedAt = Date.now();

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      const disconnectedResult = {
        connected: false,
        error: "Gateway client is not connected",
        checkedAt,
      };
      this.latestZaloStatus = disconnectedResult;
      return disconnectedResult;
    }

    try {
      const response = await this.send("channels.status", { probe: true }, timeoutMs);
      const connected = isZaloConnectedFromChannelsStatus(response);
      const result = {
        connected,
        error: connected ? null : "Zalo channel is not connected",
        checkedAt,
      };
      this.latestZaloStatus = result;
      return result;
    } catch (error) {
      const disconnectedResult = {
        connected: false,
        error: error instanceof Error ? error.message : "Failed to check zalo status",
        checkedAt,
      };
      this.latestZaloStatus = disconnectedResult;
      return disconnectedResult;
    }
  }

  connect(): void {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.intentionalClose = false;
    this.setStatus("connecting");

    try {
      this.ws = new WebSocket(this.url);
      this.ws.onopen = () => {
        this.setStatus("authenticating");
      };
      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };
      this.ws.onerror = () => {
        this.setError("WebSocket connection error");
      };
      this.ws.onclose = (event) => {
        this.ws = null;
        this.rejectPending(new Error("Gateway connection closed"));

        if (this.intentionalClose) {
          this.clearReconnectTimer();
          this.setStatus("idle");
          return;
        }

        this.setError(
          `Gateway disconnected (code ${event.code || "unknown"})`
        );
        if (event.code !== 1000) {
          this.scheduleReconnect();
        }
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to open WebSocket";
      this.setError(message);
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    this.intentionalClose = true;
    this.clearReconnectTimer();

    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }

    this.rejectPending(new Error("Gateway client disconnected"));
    this.setStatus("idle");
  }

  send<TResponse extends JsonValue = JsonValue>(
    method: string,
    params: JsonValue = {},
    timeoutMs = 0
  ): Promise<TResponse> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error("Gateway client is not connected"));
    }

    const id = `req-${this.requestId++}`;
    const request = { type: "req", id, method, params };

    return new Promise<TResponse>((resolve, reject) => {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      if (timeoutMs > 0) {
        timeoutId = setTimeout(() => {
          this.pending.delete(id);
          reject(new Error(`Gateway request timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }

      this.pending.set(id, {
        resolve: (value) => {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          resolve(value as TResponse);
        },
        reject: (reason) => {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          reject(reason);
        },
      });

      try {
        this.ws?.send(JSON.stringify(request));
      } catch (error) {
        this.pending.delete(id);
        reject(error instanceof Error ? error : new Error("Failed to send RPC"));
      }
    });
  }

  subscribe(event: string, handler: EventHandler): () => void {
    const handlers = this.eventHandlers.get(event) ?? new Set<EventHandler>();
    handlers.add(handler);
    this.eventHandlers.set(event, handlers);

    return () => {
      const current = this.eventHandlers.get(event);
      if (!current) {
        return;
      }

      current.delete(handler);
      if (current.size === 0) {
        this.eventHandlers.delete(event);
      }
    };
  }

  onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status, this.errorMessage);

    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private handleMessage(raw: string): void {
    let parsed: unknown;

    try {
      parsed = JSON.parse(raw);
    } catch {
      return;
    }

    if (!isObject(parsed)) {
      return;
    }

    if (typeof parsed.event === "string") {
      this.handleEvent(parsed);
      return;
    }

    if (typeof parsed.id === "string") {
      this.handleResponse(parsed);
    }
  }

  private handleEvent(eventMessage: Record<string, unknown>): void {
    const eventName = eventMessage.event;
    if (typeof eventName !== "string") {
      return;
    }

    if (eventName === "connect.challenge") {
      void this.handleChallenge(eventMessage);
    }

    if (eventName === "hello") {
      this.handleHello(eventMessage as unknown as HelloEvent);
    }

    const handlers = this.eventHandlers.get(eventName);
    if (!handlers) {
      return;
    }

    const payload = (eventMessage.payload ?? eventMessage) as JsonValue;
    handlers.forEach((handler) => {
      handler(payload);
    });
  }

  private async handleChallenge(eventMessage: Record<string, unknown>): Promise<void> {
    const payload = eventMessage.payload as Record<string, unknown> | undefined;
    const nonce = typeof payload?.nonce === "string" ? payload.nonce : "";
    this.currentNonce = nonce;

    const token = this.readStoredToken() || this.extractTokenFromUrl();
    if (!token) {
      this.setError("Missing gateway token. Provide token in Step 1.");
      return;
    }

    const credentials = await this.ensureDeviceCredentials();
    const deviceId = credentials.deviceId;
    const publicKey = credentials.publicKey;
    const privateKey = credentials.privateKey;
    const deviceToken = credentials.deviceToken;

    const signedAt = Date.now();
    const connectId = `connect-${this.requestId++}`;
    const scopes = [
      "operator.admin",
      "operator.read",
      "operator.write",
      "operator.approvals",
      "operator.pairing",
    ];

    const signaturePayload = [
      "v2",
      deviceId,
      "openclaw-control-ui",
      "webchat",
      "operator",
      scopes.join(","),
      String(signedAt),
      token,
      nonce,
    ].join("|");

    const signature = await signAsync(
      new TextEncoder().encode(signaturePayload),
      this.fromBase64Url(privateKey)
    );

    const message = {
      type: "req",
      id: connectId,
      method: "connect",
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: "openclaw-control-ui",
          version: "2026.3.23",
          platform: typeof navigator !== "undefined" ? navigator.platform : "web",
          mode: "webchat",
          instanceId: deviceId,
        },
        role: "operator",
        scopes,
        device: {
          id: deviceId,
          publicKey,
          signature: this.toBase64Url(signature),
          signedAt,
          nonce,
        },
        caps: ["tool-events"],
        auth: {
          token,
          ...(deviceToken ? { deviceToken } : {}),
        },
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : "browser",
        locale:
          typeof navigator !== "undefined" && navigator.language
            ? navigator.language
            : "en-US",
      },
    };

    try {
      this.ws?.send(JSON.stringify(message));
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : "Failed during auth handshake";
      this.setError(messageText);
    }
  }

  private handleHello(event: HelloEvent): void {
    if (typeof event.token === "string") {
      this.storeToken(event.token);
    }

    this.reconnectAttempts = 0;
    this.clearReconnectTimer();
    this.setStatus("connected");
  }

  private handleResponse(message: Record<string, unknown>): void {
    if (typeof message.id !== "string") {
      return;
    }

    const hasLegacyResult = "result" in message;
    const ok = message.ok === true || (message.ok === undefined && hasLegacyResult);
    const payload = (message.payload ?? message.result) as JsonValue | undefined;
    const rpcError = isObject(message.error)
      ? ({
          code:
            typeof message.error.code === "number" ? message.error.code : -1,
          message:
            typeof message.error.message === "string"
              ? message.error.message
              : "Gateway error",
          data: message.error.data as JsonValue | undefined,
        } as RpcError)
      : undefined;

    if (message.id.startsWith("connect-")) {
      if (!ok) {
        this.setError(rpcError?.message ?? "Gateway connect handshake failed");
        return;
      }

      const connectPayload = isObject(payload) ? payload : null;
      const nextDeviceToken =
        connectPayload && typeof connectPayload.deviceToken === "string"
          ? connectPayload.deviceToken
          : "";
      if (nextDeviceToken) {
        this.storeDeviceToken(nextDeviceToken);
      }

      this.reconnectAttempts = 0;
      this.clearReconnectTimer();
      this.setStatus("connected");
      return;
    }

    const pending = this.pending.get(message.id);
    if (!pending) {
      return;
    }

    this.pending.delete(message.id);

    if (!ok) {
      pending.reject(rpcError ?? new Error("RPC request failed"));
      return;
    }

    pending.resolve((payload ?? null) as JsonValue);
  }

  private scheduleReconnect(): void {
    this.clearReconnectTimer();

    const delay = Math.min(
      RECONNECT_MAX_DELAY_MS,
      1000 * 2 ** this.reconnectAttempts
    );
    this.reconnectAttempts += 1;

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (!this.reconnectTimer) {
      return;
    }

    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }

  private rejectPending(reason: Error): void {
    this.pending.forEach((pending) => pending.reject(reason));
    this.pending.clear();
  }

  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    if (status !== "error") {
      this.errorMessage = null;
    }
    this.notifyStatusListeners();
  }

  private setError(message: string): void {
    this.errorMessage = message;
    this.status = "error";
    this.notifyStatusListeners();
  }

  private notifyStatusListeners(): void {
    this.statusListeners.forEach((listener) =>
      listener(this.status, this.errorMessage)
    );
  }

  private readStoredToken(): string {
    if (typeof window === "undefined") {
      return "";
    }

    return window.localStorage.getItem(TOKEN_STORAGE_KEY) ?? "";
  }

  private storeToken(token: string): void {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }

  private storeDeviceToken(token: string): void {
    this.storeStorageValue(DEVICE_TOKEN_STORAGE_KEY, token);
  }

  private readStorageValue(key: string): string {
    if (typeof window === "undefined") {
      return "";
    }

    return window.localStorage.getItem(key)?.trim() ?? "";
  }

  private storeStorageValue(key: string, value: string): void {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(key, value);
  }

  private async ensureDeviceCredentials(): Promise<{
    deviceId: string;
    publicKey: string;
    privateKey: string;
    deviceToken: string;
  }> {
    let deviceId = this.readStorageValue(DEVICE_ID_STORAGE_KEY);
    let publicKey = this.readStorageValue(DEVICE_PUBLIC_KEY_STORAGE_KEY);
    let privateKey = this.readStorageValue(DEVICE_PRIVATE_KEY_STORAGE_KEY);
    const deviceToken = this.readStorageValue(DEVICE_TOKEN_STORAGE_KEY);

    if (!privateKey || !publicKey) {
      const generatedPrivate = edUtils.randomSecretKey();
      const generatedPublic = await getPublicKeyAsync(generatedPrivate);

      privateKey = this.toBase64Url(generatedPrivate);
      publicKey = this.toBase64Url(generatedPublic);
      this.storeStorageValue(DEVICE_PRIVATE_KEY_STORAGE_KEY, privateKey);
      this.storeStorageValue(DEVICE_PUBLIC_KEY_STORAGE_KEY, publicKey);
    }

    if (!deviceId) {
      const publicKeyBytes = this.fromBase64Url(publicKey);
      const stableBytes = Uint8Array.from(publicKeyBytes);
      const digest = await crypto.subtle.digest("SHA-256", stableBytes.buffer);
      const digestBytes = new Uint8Array(digest);
      deviceId = this.bytesToHex(digestBytes);
      this.storeStorageValue(DEVICE_ID_STORAGE_KEY, deviceId);
    }

    return { deviceId, publicKey, privateKey, deviceToken };
  }

  private fromBase64Url(value: string): Uint8Array {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
  }

  private toBase64Url(bytes: Uint8Array): string {
    let binary = "";
    for (let i = 0; i < bytes.length; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }

    return btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }

  private bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  private extractTokenFromUrl(): string {
    if (typeof window === "undefined" || typeof URLSearchParams === "undefined") {
      return "";
    }

    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("token") ?? "";
    } catch {
      return "";
    }
  }
}
