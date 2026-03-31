import {
  createGatewayConfigService,
  type GatewayConfigSnapshot,
} from "@/lib/gateway/config";
import type { JsonValue } from "@/lib/gateway/types";

type SendFn = (method: string, params?: JsonValue) => Promise<JsonValue>;

type ExecutePairingResult = {
  message: string;
  method: string;
  response: JsonValue;
  runId: string;
  waitStatus: string;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function readBotTokenFromZaloEntry(zalo: Record<string, unknown>): string | null {
  const directToken = readString(zalo.botToken);
  if (directToken) {
    return directToken;
  }

  const accounts = isObject(zalo.accounts) ? zalo.accounts : null;
  if (!accounts) {
    return null;
  }

  const defaultAccount = isObject(accounts.default) ? accounts.default : null;
  if (!defaultAccount) {
    return null;
  }

  return readString(defaultAccount.botToken);
}

function asJsonValue(value: Record<string, unknown>): JsonValue {
  return JSON.parse(JSON.stringify(value)) as JsonValue;
}

function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `zalo-pair-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readRunId(payload: JsonValue): string | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const record = payload as Record<string, unknown>;
  return typeof record.runId === "string" && record.runId.trim().length > 0
    ? record.runId.trim()
    : null;
}

function readWaitStatus(payload: JsonValue): string {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return "unknown";
  }

  const record = payload as Record<string, unknown>;
  return typeof record.status === "string" && record.status.trim().length > 0
    ? record.status.trim()
    : "unknown";
}

export async function loadZaloConfigState(send: SendFn): Promise<{
  snapshot: GatewayConfigSnapshot;
  botToken: string;
  hasBotToken: boolean;
}> {
  const configService = createGatewayConfigService(send);
  const snapshot = await configService.load();

  const channels = isObject(snapshot.normalized.channels)
    ? snapshot.normalized.channels
    : {};
  const zalo = isObject(channels.zalo) ? channels.zalo : {};
  const botToken = readBotTokenFromZaloEntry(zalo) ?? "";

  return {
    snapshot,
    botToken,
    hasBotToken: botToken.length > 0,
  };
}

export async function saveZaloBotToken(
  send: SendFn,
  token: string
): Promise<GatewayConfigSnapshot> {
  const normalizedToken = token.trim();
  if (!normalizedToken) {
    throw new Error("Bot token is required.");
  }

  const configService = createGatewayConfigService(send);
  const current = await configService.load();

  const channels = isObject(current.normalized.source.channels)
    ? current.normalized.source.channels
    : {};
  const currentZalo = isObject(channels.zalo) ? channels.zalo : {};
  const accounts = isObject(currentZalo.accounts) ? currentZalo.accounts : {};
  const defaultAccount = isObject(accounts.default) ? accounts.default : {};

  const nextZalo: Record<string, unknown> = {
    ...currentZalo,
    enabled: true,
    accounts: {
      ...accounts,
      default: {
        ...defaultAccount,
        botToken: normalizedToken,
      },
    },
  };

  return configService.update([
    {
      op: "set",
      path: "channels.zalo",
      value: asJsonValue(nextZalo),
    },
  ]);
}

export async function executePairingGuide(
  send: SendFn,
  pairingGuide: string
): Promise<ExecutePairingResult> {
  const message = pairingGuide.trim();
  if (!message) {
    throw new Error("Pairing guide message is required.");
  }

  const idempotencyKey = createIdempotencyKey();

  const accepted = await send("agent", {
    message,
    idempotencyKey,
    agentId: "main",
  });

  const runId = readRunId(accepted);
  if (!runId) {
    throw new Error("Agent accepted response did not include runId.");
  }

  const waitResponse = await send("agent.wait", {
    runId,
    timeoutMs: 30000,
  });

  const waitStatus = readWaitStatus(waitResponse);
  if (waitStatus !== "ok") {
    throw new Error(`Agent execution did not complete successfully (status: ${waitStatus}).`);
  }

  return {
    message,
    method: "agent",
    response: waitResponse,
    runId,
    waitStatus,
  };
}