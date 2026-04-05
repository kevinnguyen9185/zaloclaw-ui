import { describe, expect, it, vi } from "vitest";

import type { JsonValue } from "@/lib/gateway/types";

import {
  executePairingGuide,
  loadZaloConfigState,
  saveZaloBotToken,
} from "./config-service";

const CONFIG_GET_PAYLOAD = {
  path: "/tmp/openclaw.json",
  exists: true,
  baseHash: "hash-zalo-1",
  parsed: {
    channels: {
      zalo: {
        enabled: true,
        dmPolicy: "allowlist",
        allowFrom: ["0bb28150ce1b27457e0a"],
        accounts: {
          default: {
            dmPolicy: "pairing",
            botToken: "old-token",
          },
        },
      },
    },
  },
};

describe("zalo config service", () => {
  it("loads current bot token from channels.zalo.accounts.default", async () => {
    const send = vi.fn(async (method: string) => {
      if (method === "config.get") {
        return CONFIG_GET_PAYLOAD as unknown as JsonValue;
      }

      throw new Error(`Unexpected method: ${method}`);
    });

    const state = await loadZaloConfigState(send);
    expect(state.hasBotToken).toBe(true);
    expect(state.botToken).toBe("old-token");
  });

  it("saves token at channels.zalo while preserving unrelated fields", async () => {
    const updatedPayload = {
      ...CONFIG_GET_PAYLOAD,
      parsed: {
        channels: {
          zalo: {
            enabled: true,
            dmPolicy: "allowlist",
            allowFrom: ["0bb28150ce1b27457e0a"],
            accounts: {
              default: {
                dmPolicy: "pairing",
                botToken: "new-token",
              },
            },
          },
        },
      },
    };

    const send = vi.fn(async (method: string, params?: JsonValue) => {
      if (method === "config.get") {
        if (!send.mock.calls.some(([called]) => called === "config.set")) {
          return CONFIG_GET_PAYLOAD as unknown as JsonValue;
        }

        return updatedPayload as unknown as JsonValue;
      }

      if (method === "config.set") {
        return { ok: true, received: params } as JsonValue;
      }

      throw new Error(`Unexpected method: ${method}`);
    });

    const result = await saveZaloBotToken(send, "new-token");

    expect(send).toHaveBeenCalledWith(
      "config.set",
      expect.objectContaining({
        raw: expect.any(String),
        baseHash: "hash-zalo-1",
      })
    );

    const configSetCall = send.mock.calls.find(([method]) => method === "config.set");
    const params = (configSetCall?.[1] ?? {}) as { raw?: string };
    const parsed = JSON.parse(params.raw ?? "{}") as {
      channels?: {
        zalo?: {
          dmPolicy?: string;
          allowFrom?: string[];
          accounts?: {
            default?: {
              dmPolicy?: string;
              botToken?: string;
            };
          };
        };
      };
    };

    expect(parsed.channels?.zalo?.accounts?.default?.botToken).toBe("new-token");
    expect(parsed.channels?.zalo?.accounts?.default?.dmPolicy).toBe("pairing");
    expect(parsed.channels?.zalo?.dmPolicy).toBe("allowlist");
    expect(parsed.channels?.zalo?.allowFrom).toEqual(["0bb28150ce1b27457e0a"]);
    expect(result.normalized.channels).toBeTruthy();
  });

  it("defaults dmPolicy to pairing when missing while saving token", async () => {
    const initialWithoutPolicy = {
      ...CONFIG_GET_PAYLOAD,
      parsed: {
        channels: {
          zalo: {
            enabled: true,
            accounts: {
              default: {
                botToken: "old-token",
              },
            },
          },
        },
      },
    };

    const updatedPayload = {
      ...initialWithoutPolicy,
      parsed: {
        channels: {
          zalo: {
            enabled: true,
            accounts: {
              default: {
                dmPolicy: "pairing",
                botToken: "new-token",
              },
            },
          },
        },
      },
    };

    const send = vi.fn(async (method: string, params?: JsonValue) => {
      if (method === "config.get") {
        if (!send.mock.calls.some(([called]) => called === "config.set")) {
          return initialWithoutPolicy as unknown as JsonValue;
        }

        return updatedPayload as unknown as JsonValue;
      }

      if (method === "config.set") {
        return { ok: true, received: params } as JsonValue;
      }

      throw new Error(`Unexpected method: ${method}`);
    });

    await saveZaloBotToken(send, "new-token");

    const configSetCall = send.mock.calls.find(([method]) => method === "config.set");
    const params = (configSetCall?.[1] ?? {}) as { raw?: string };
    const parsed = JSON.parse(params.raw ?? "{}") as {
      channels?: {
        zalo?: {
          accounts?: {
            default?: {
              dmPolicy?: string;
              botToken?: string;
            };
          };
        };
      };
    };

    expect(parsed.channels?.zalo?.accounts?.default?.dmPolicy).toBe("pairing");
    expect(parsed.channels?.zalo?.accounts?.default?.botToken).toBe("new-token");
  });

  it("forwards full pairing guide message via agent and waits for completion", async () => {
    const fullMessage = [
      "OpenClaw: access not configured.",
      "",
      "Your Zalo user id: 0bb28150ce1b27457e0a",
      "",
      "Pairing code: ENZMB3K8",
      "",
      "Ask the bot owner to approve with:",
      "openclaw pairing approve zalo ENZMB3K8",
    ].join("\n");
    const expectedMessage = [
      "Use this message below to pair Zalo bot account",
      "",
      fullMessage,
    ].join("\n");

    const send = vi.fn(async (method: string, params?: JsonValue) => {
      if (method === "agent") {
        const payload = params as Record<string, unknown>;
        expect(typeof payload.idempotencyKey).toBe("string");
        expect(payload.message).toBe(expectedMessage);
        expect(payload.agentId).toBe("main");
        return { runId: "run-123", status: "accepted" } as JsonValue;
      }

      if (method === "agent.wait") {
        const payload = params as Record<string, unknown>;
        expect(payload.runId).toBe("run-123");
        expect(payload.timeoutMs).toBe(30000);
        return { runId: "run-123", status: "ok" } as JsonValue;
      }

      throw new Error(`Unexpected method: ${method}`);
    });

    const result = await executePairingGuide(send, fullMessage);

  expect(result.message).toBe(expectedMessage);
    expect(result.method).toBe("agent");
    expect(result.runId).toBe("run-123");
    expect(result.waitStatus).toBe("ok");
    expect(send).toHaveBeenCalledTimes(2);
    expect(send).toHaveBeenNthCalledWith(
      1,
      "agent",
      expect.objectContaining({ message: expectedMessage, idempotencyKey: expect.any(String), agentId: "main" })
    );
    expect(send).toHaveBeenNthCalledWith(2, "agent.wait", {
      runId: "run-123",
      timeoutMs: 30000,
    });
  });
});