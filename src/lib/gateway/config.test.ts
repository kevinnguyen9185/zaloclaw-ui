import { describe, expect, it, vi } from "vitest";

import {
  applyConfigPatch,
  createGatewayConfigService,
  normalizeGatewayConfig,
  normalizeModelIdentifier,
  serializeConfigPatch,
  toPrimaryModelReference,
} from "@/lib/gateway/config";
import type { JsonValue } from "@/lib/gateway/types";

const FULL_CONFIG_GET_PAYLOAD = {
  path: "/home/node/.openclaw/openclaw.json",
  exists: true,
  raw: "{ ... }",
  parsed: {
    models: {
      mode: "merge",
      providers: {
        litellm: {
          baseUrl: "http://host.docker.internal:4000",
        },
      },
    },
    agents: {
      defaults: {
        model: {
          primary: "litellm/openclaw-smart-router",
        },
      },
    },
    gateway: {
      mode: "local",
      bind: "lan",
      port: 18789,
    },
    channels: {
      zalo: {
        enabled: true,
      },
    },
    hooks: {
      internal: {
        enabled: true,
      },
    },
  },
};

describe("gateway config service", () => {
  it("normalizes realistic config.get payload shape", () => {
    const normalized = normalizeGatewayConfig(FULL_CONFIG_GET_PAYLOAD);

    expect(normalized.path).toBe("/home/node/.openclaw/openclaw.json");
    expect(normalized.exists).toBe(true);
    expect(normalized.normalized.models.mode).toBe("merge");
    expect(normalized.normalized.gateway.port).toBe(18789);
    expect(normalized.normalized.agents.defaults.model.primary).toBe(
      "litellm/openclaw-smart-router"
    );
    expect((normalized.normalized.source.hooks as { internal?: { enabled?: boolean } })?.internal?.enabled).toBe(true);
  });

  it("applies stable defaults for partial config payloads", () => {
    const normalized = normalizeGatewayConfig({ exists: false, parsed: {} });

    expect(normalized.exists).toBe(false);
    expect(normalized.normalized.models.mode).toBe("merge");
    expect(normalized.normalized.agents.defaults.model.primary).toBeNull();
    expect(normalized.normalized.gateway.mode).toBe("local");
    expect(normalized.normalized.gateway.bind).toBe("lan");
    expect(normalized.normalized.channels).toEqual({});
  });

  it("normalizes full ws response envelope with payload.config", () => {
    const fullEnvelope = {
      type: "res",
      id: "req-1",
      ok: true,
      payload: {
        path: "/home/node/.openclaw/openclaw.json",
        exists: true,
        raw: "{ ... }",
        config: {
          meta: {
            lastTouchedVersion: "2026.3.23",
            lastTouchedAt: "2026-03-26T08:02:53.906Z",
          },
          wizard: {
            lastRunAt: "2026-03-24T15:02:27.059Z",
            lastRunVersion: "2026.3.23",
            lastRunCommand: "onboard",
            lastRunMode: "local",
          },
          agents: {
            defaults: {
              model: {
                primary: "litellm/openclaw-smart-router",
              },
              maxConcurrent: 4,
              subagents: {
                maxConcurrent: 8,
              },
            },
          },
          messages: {
            ackReactionScope: "group-mentions",
          },
          gateway: {
            mode: "local",
            bind: "lan",
            port: 18789,
            controlUi: {
              allowInsecureAuth: true,
            },
          },
        },
      },
    };

    const normalized = normalizeGatewayConfig(fullEnvelope);
    expect(normalized.path).toBe("/home/node/.openclaw/openclaw.json");
    expect(normalized.exists).toBe(true);
    expect(normalized.normalized.meta.lastTouchedVersion).toBe("2026.3.23");
    expect(normalized.normalized.wizard.lastRunCommand).toBe("onboard");
    expect(normalized.normalized.agents.defaults.maxConcurrent).toBe(4);
    expect(normalized.normalized.agents.defaults.subagentsMaxConcurrent).toBe(8);
    expect(normalized.normalized.messages.ackReactionScope).toBe(
      "group-mentions"
    );
    expect(
      (normalized.normalized.gateway.controlUi as { allowInsecureAuth?: boolean })
        .allowInsecureAuth
    ).toBe(true);
  });

  it("builds and applies targeted patch operations", () => {
    const source = {
      agents: {
        defaults: {
          model: {
            primary: "litellm/old-model",
          },
        },
      },
      channels: {
        zalo: {
          enabled: true,
        },
      },
    } as Record<string, unknown>;

    const next = applyConfigPatch(source, [
      {
        op: "set",
        path: "agents.defaults.model.primary",
        value: "openai/gpt-5.1-codex",
      },
      {
        op: "merge",
        path: ["gateway", "controlUi"],
        value: {
          allowInsecureAuth: true,
        },
      },
      {
        op: "unset",
        path: "channels.zalo.enabled",
      },
    ]);

    expect(source).not.toBe(next);
    expect(
      (((next.agents as Record<string, unknown>).defaults as Record<string, unknown>)
        .model as Record<string, unknown>).primary
    ).toBe("openai/gpt-5.1-codex");
    expect(
      ((((next.gateway as Record<string, unknown>).controlUi as Record<string, unknown>)
        .allowInsecureAuth as boolean) ?? false)
    ).toBe(true);
    expect(
      ((((next.channels as Record<string, unknown>).zalo as Record<string, unknown>)
        .enabled as boolean | undefined) ?? undefined)
    ).toBeUndefined();
  });

  it("serializes patch operations to deterministic dot-path payload", () => {
    const patch = serializeConfigPatch([
      { op: "set", path: "a.b", value: "x" },
      { op: "unset", path: ["a", "c"] },
      { op: "merge", path: "gateway.controlUi", value: { allow: true } },
    ]);

    expect(patch).toEqual({
      set: {
        "a.b": "x",
      },
      unset: ["a.c"],
      merge: {
        "gateway.controlUi": {
          allow: true,
        },
      },
    });
  });

  it("loads and refreshes config after config.set", async () => {
    const nextPayload = {
      ...FULL_CONFIG_GET_PAYLOAD,
      parsed: {
        ...FULL_CONFIG_GET_PAYLOAD.parsed,
        agents: {
          defaults: {
            model: {
              primary: "openai/gpt-5.1-codex",
            },
          },
        },
      },
    };

    const send = vi.fn(async (method: string, params?: JsonValue) => {
      if (method === "config.get") {
        if (!send.mock.calls.some(([called]) => called === "config.set")) {
          return FULL_CONFIG_GET_PAYLOAD as unknown as JsonValue;
        }

        return nextPayload as unknown as JsonValue;
      }

      if (method === "config.set") {
        const input = params as Record<string, unknown>;
        expect(input.patch).toBeDefined();
        expect(input.config).toBeDefined();
        return { ok: true } as JsonValue;
      }

      throw new Error(`Unexpected method: ${method}`);
    });

    const service = createGatewayConfigService(send);
    const updated = await service.update([
      {
        op: "set",
        path: "agents.defaults.model.primary",
        value: "openai/gpt-5.1-codex",
      },
    ]);

    expect(send).toHaveBeenCalledWith("config.get", {});
    expect(send).toHaveBeenCalledWith(
      "config.set",
      expect.objectContaining({
        patch: expect.any(Object),
        config: expect.any(Object),
      })
    );
    expect(updated.normalized.agents.defaults.model.primary).toBe(
      "openai/gpt-5.1-codex"
    );
  });

  it("maps model references for onboarding selection", () => {
    expect(normalizeModelIdentifier("litellm/openclaw-smart-router")).toBe(
      "openclaw-smart-router"
    );
    expect(toPrimaryModelReference("openclaw-smart-router", "litellm")).toBe(
      "litellm/openclaw-smart-router"
    );
    expect(toPrimaryModelReference("openai/gpt-5.1-codex", "openai")).toBe(
      "openai/gpt-5.1-codex"
    );
  });
});
