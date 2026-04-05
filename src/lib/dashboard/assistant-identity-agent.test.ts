import { describe, expect, it, vi } from "vitest";

import type { JsonValue } from "@/lib/gateway/types";

import { executeAssistantIdentityUpdate } from "@/lib/dashboard/assistant-identity-agent";

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

    const result = await executeAssistantIdentityUpdate(
      send,
      {
        assistantName: "Miso",
        creatureType: "ghost",
        vibe: "warm",
        emoji: "👻",
        userName: "Hung",
        timezone: "Asia/Ho_Chi_Minh",
      },
      {
        agent: "# AGENT",
        soul: "# SOUL",
        user: "# USER",
      }
    );

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
});