import {
  createGatewayConfigService,
  type GatewayConfigSnapshot,
} from "@/lib/gateway/config";
import type { JsonValue } from "@/lib/gateway/types";

type SendFn = (method: string, params?: JsonValue) => Promise<JsonValue>;

type ApprovalMode = "allow-once" | "allow-always";

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

function extractApprovalCommand(
  rawText: string,
  mode: ApprovalMode
): string {
  const text = rawText.trim();
  if (!text) {
    throw new Error("Approval request message is required.");
  }

  const approveMatch = text.match(/\/approve\s+([a-zA-Z0-9-]+)\s+(allow-once|allow-always)/i);
  if (approveMatch) {
    const requestId = approveMatch[1];
    return `/approve ${requestId} ${mode}`;
  }

  const openclawMatch = text.match(/openclaw\s+pairing\s+approve\s+zalo\s+([A-Z0-9]+)/i);
  if (openclawMatch) {
    const pairingCode = openclawMatch[1];
    return `openclaw pairing approve zalo ${pairingCode}`;
  }

  throw new Error(
    "Could not find approval command. Paste a message that includes '/approve ...' or 'openclaw pairing approve zalo ...'."
  );
}

export function buildPairingApprovalCommand(
  approvalRequest: string,
  mode: ApprovalMode
): string {
  return extractApprovalCommand(approvalRequest, mode);
}

export function buildPairingApproveCommandFromGuide(pairingGuide: string): string {
  const text = pairingGuide.trim();
  if (!text) {
    throw new Error("Pairing guide message is required.");
  }

  const commandMatch = text.match(/openclaw\s+pairing\s+approve\s+zalo\s+([A-Z0-9]+)/i);
  if (!commandMatch) {
    throw new Error(
      "Could not find 'openclaw pairing approve zalo <code>' in pairing guide message."
    );
  }

  return `openclaw pairing approve zalo ${commandMatch[1]}`;
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
  const existingDmPolicy = readString(defaultAccount.dmPolicy);

  const nextZalo: Record<string, unknown> = {
    ...currentZalo,
    enabled: true,
    accounts: {
      ...accounts,
      default: {
        ...defaultAccount,
        dmPolicy: existingDmPolicy ?? "pairing",
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

export type PairingGuideResult = {
  message: string;
  method: string;
  runId: string;
  waitStatus: string;
};

export async function executePairingGuide(
  send: SendFn,
  pairingGuide: string
): Promise<PairingGuideResult> {
  const trimmed = pairingGuide.trim();
  if (!trimmed) {
    throw new Error("Pairing guide message is required.");
  }

  const message = [
    "Use this message below to pair Zalo bot account",
    "",
    trimmed,
  ].join("\n");

  const idempotencyKey = `zalo-pair-${Date.now()}`;

  const agentResponse = await send("agent", {
    idempotencyKey,
    message,
    agentId: "main",
  }) as Record<string, unknown>;

  const runId = typeof agentResponse.runId === "string" ? agentResponse.runId : "";

  const waitResponse = await send("agent.wait", {
    runId,
    timeoutMs: 30000,
  }) as Record<string, unknown>;

  const waitStatus = typeof waitResponse.status === "string" ? waitResponse.status : "";

  return { message, method: "agent", runId, waitStatus };
}