import { describe, expect, it, vi } from "vitest";

import type { JsonValue } from "@/lib/gateway/types";

import { executeAssistantIdentityUpdate } from "@/lib/dashboard/assistant-identity-agent";

const IDENTITY_PROFILE = {
  assistantName: "Miso",
  creatureType: "ghost",
  vibe: "warm",
  emoji: "👻",
  userName: "Hung",
  timezone: "Asia/Ho_Chi_Minh",
} as const;

const IDENTITY_DOCUMENTS = {
  agent: "# AGENT",
  soul: "# SOUL",
  user: "# USER",
} as const;

describe("assistant identity agent", () => {
  it("sends identity update via agent and waits for completion", async () => {
    const send = vi.fn(async (method: string, params?: JsonValue) => {
      if (method === "agent") {
        const payload = params as Record<string, unknown>;
        expect(typeof payload.idempotencyKey).toBe("string");
        expect(payload.agentId).toBe("main");
        expect(typeof payload.message).toBe("string");
        return { runId: "run-identity-1", status: "accepted" } as JsonValue;
      }

      if (method === "agent.wait") {
        return { runId: "run-identity-1", status: "ok" } as JsonValue;
      }

      throw new Error(`Unexpected method: ${method}`);
    });

    const result = await executeAssistantIdentityUpdate(send, IDENTITY_PROFILE, IDENTITY_DOCUMENTS);

    expect(result).toEqual({ runId: "run-identity-1", waitStatus: "ok" });
    expect(send).toHaveBeenNthCalledWith(
      1,
      "agent",
      expect.objectContaining({ agentId: "main", idempotencyKey: expect.any(String) })
    );
    expect(send).toHaveBeenNthCalledWith(2, "agent.wait", {
      runId: "run-identity-1",
      timeoutMs: 30000,
    });
  });

  it("retries when agent.wait returns timeout status and succeeds later", async () => {
    let waitCalls = 0;
    const send = vi.fn(async (method: string) => {
      if (method === "agent") {
        return { runId: "run-identity-2", status: "accepted" } as JsonValue;
      }

      if (method === "agent.wait") {
        waitCalls += 1;
        if (waitCalls < 3) {
          return { runId: "run-identity-2", status: "timeout" } as JsonValue;
        }

        return { runId: "run-identity-2", status: "ok" } as JsonValue;
      }

      throw new Error(`Unexpected method: ${method}`);
    });

    const result = await executeAssistantIdentityUpdate(send, IDENTITY_PROFILE, IDENTITY_DOCUMENTS);

    expect(result).toEqual({ runId: "run-identity-2", waitStatus: "ok" });
    expect(send).toHaveBeenCalledTimes(4);
    expect(waitCalls).toBe(3);
  });
});