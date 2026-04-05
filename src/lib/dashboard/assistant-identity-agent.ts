import type {
  AssistantIdentityDocuments,
  AssistantIdentityProfile,
} from "@/lib/dashboard/assistant-identity";
import type { JsonValue } from "@/lib/gateway/types";

type SendFn = (method: string, params?: JsonValue) => Promise<JsonValue>;

function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `identity-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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

function buildAgentMessage(
  profile: AssistantIdentityProfile,
  documents: AssistantIdentityDocuments
): string {
  return [
    "Update OpenClaw identity documents with this profile.",
    "",
    `Assistant Name: ${profile.assistantName}`,
    `Creature Type: ${profile.creatureType}`,
    `Vibe: ${profile.vibe}`,
    `Emoji: ${profile.emoji}`,
    `User Name: ${profile.userName}`,
    `Timezone: ${profile.timezone}`,
    "",
    "Apply these document contents to AGENT.md, SOUL.md, and USER.md.",
    "",
    "AGENT.md:",
    documents.agent,
    "",
    "SOUL.md:",
    documents.soul,
    "",
    "USER.md:",
    documents.user,
  ].join("\n");
}

export async function executeAssistantIdentityUpdate(
  send: SendFn,
  profile: AssistantIdentityProfile,
  documents: AssistantIdentityDocuments
): Promise<{ runId: string; waitStatus: string }> {
  const accepted = await send("agent", {
    message: buildAgentMessage(profile, documents),
    idempotencyKey: createIdempotencyKey(),
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

  return { runId, waitStatus };
}