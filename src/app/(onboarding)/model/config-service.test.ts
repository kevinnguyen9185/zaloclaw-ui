import { describe, expect, it, vi } from "vitest";

import type { JsonValue } from "@/lib/gateway/types";

import { loadModelStepState, saveModelSelection } from "./config-service";

const CONFIG_GET_PAYLOAD = {
  path: "/tmp/openclaw.json",
  exists: true,
  baseHash: "hash-1",
  parsed: {
    models: {
      providers: {
        openrouter: {
          apiKey: "sk-existing",
          models: [
            {
              id: "openai/gpt-4.1-mini",
              name: "openai/gpt-4.1-mini",
            },
          ],
        },
      },
    },
    agents: {
      models: {
        "openrouter/openai/gpt-4o-mini": {
          alias: "GPT-4o mini",
        },
        "litellm/openclaw-smart-router": {
          alias: "LiteLLM",
        },
      },
      defaults: {
        model: {
          primary: "openrouter/openai/gpt-4o-mini",
          provider: "google",
          id: "gemini-2.5-flash",
        },
        models: {
          "litellm/openclaw-smart-router": {
            alias: "LiteLLM",
          },
        },
      },
    },
  },
};

describe("onboarding model config service integration", () => {
  it("loads model options from config.get agents.models and defaults to agents.defaults.model.primary", async () => {
    const send = vi.fn(async (method: string) => {
      if (method === "config.get") {
        return CONFIG_GET_PAYLOAD as unknown as JsonValue;
      }

      throw new Error(`Unexpected method: ${method}`);
    });

    const state = await loadModelStepState(send);

    expect(send).toHaveBeenCalledWith("config.get", {});
    expect(state.selectedModelId).toBe("openrouter/openai/gpt-4o-mini");
    expect(state.modelOptions).toEqual([
      {
        id: "openrouter/openai/gpt-4o-mini",
        name: "openai/gpt-4o-mini",
        provider: "openrouter",
      },
      {
        id: "litellm/openclaw-smart-router",
        name: "openclaw-smart-router",
        provider: "litellm",
      },
    ]);
  });

  it("falls back to agents.defaults.models when agents.models is missing", async () => {
    const configWithoutAgentsModels = {
      ...CONFIG_GET_PAYLOAD,
      parsed: {
        ...CONFIG_GET_PAYLOAD.parsed,
        agents: {
          defaults: CONFIG_GET_PAYLOAD.parsed.agents.defaults,
        },
      },
    };

    const send = vi.fn(async (method: string) => {
      if (method === "config.get") {
        return configWithoutAgentsModels as unknown as JsonValue;
      }

      throw new Error(`Unexpected method: ${method}`);
    });

    const state = await loadModelStepState(send);

    expect(state.selectedModelId).toBe("openrouter/openai/gpt-4o-mini");
    expect(state.modelOptions).toEqual([
      {
        id: "openrouter/openai/gpt-4o-mini",
        name: "openai/gpt-4o-mini",
        provider: "openrouter",
      },
      {
        id: "litellm/openclaw-smart-router",
        name: "openclaw-smart-router",
        provider: "litellm",
      },
    ]);
  });

  it("keeps the saved primary model selectable when it is missing from the config model registry", async () => {
    const send = vi.fn(async (method: string) => {
      if (method === "config.get") {
        return {
          ...CONFIG_GET_PAYLOAD,
          parsed: {
            ...CONFIG_GET_PAYLOAD.parsed,
            agents: {
              models: {
                "litellm/openclaw-smart-router": {
                  alias: "LiteLLM",
                },
              },
              defaults: CONFIG_GET_PAYLOAD.parsed.agents.defaults,
            },
          },
        } as JsonValue;
      }

      throw new Error(`Unexpected method: ${method}`);
    });

    const state = await loadModelStepState(send);

    expect(state.selectedModelId).toBe("openrouter/openai/gpt-4o-mini");
    expect(state.modelOptions).toEqual([
      {
        id: "openrouter/openai/gpt-4o-mini",
        name: "openai/gpt-4o-mini",
        provider: "openrouter",
      },
      {
        id: "litellm/openclaw-smart-router",
        name: "openclaw-smart-router",
        provider: "litellm",
      },
    ]);
  });

  it("rejects save when no primary model is selected", async () => {
    const send = vi.fn(async (method: string) => {
      if (method === "config.get") {
        return CONFIG_GET_PAYLOAD as unknown as JsonValue;
      }

      if (method === "config.set") {
        return { ok: true } as JsonValue;
      }

      throw new Error(`Unexpected method: ${method}`);
    });

    await expect(
      saveModelSelection(send, {
        primaryModel: "   ",
      })
    ).rejects.toThrow("Select a primary model before saving.");

    expect(send).not.toHaveBeenCalledWith("config.set", expect.anything());
  });

  it("updates only the primary model reference and preserves unrelated configuration", async () => {
    const updatedPayload = {
      ...CONFIG_GET_PAYLOAD,
      parsed: {
        ...CONFIG_GET_PAYLOAD.parsed,
        agents: {
          defaults: {
            model: {
              primary: "litellm/openclaw-smart-router",
              provider: "google",
              id: "gemini-2.5-flash",
            },
            models: {
              "litellm/openclaw-smart-router": {
                alias: "LiteLLM",
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

    const result = await saveModelSelection(send, {
      primaryModel: "litellm/openclaw-smart-router",
    });

    expect(send).toHaveBeenCalledWith(
      "config.set",
      expect.objectContaining({
        raw: expect.any(String),
        baseHash: "hash-1",
      })
    );

    const configSetCall = send.mock.calls.find(([method]) => method === "config.set");
    const params = (configSetCall?.[1] ?? {}) as { raw?: string };
    const parsed = JSON.parse(params.raw ?? "{}") as {
      models?: {
        providers?: Record<string, unknown>;
      };
      agents?: {
        defaults?: {
          model?: {
            primary?: string;
            provider?: string;
            id?: string;
          };
          models?: Record<string, unknown>;
        };
      };
    };

    expect(parsed.agents?.defaults?.model).toEqual({
      primary: "litellm/openclaw-smart-router",
      provider: "google",
      id: "gemini-2.5-flash",
    });
    expect(parsed.models?.providers).toEqual(CONFIG_GET_PAYLOAD.parsed.models.providers);
    expect(parsed.agents?.defaults?.models).toEqual(
      CONFIG_GET_PAYLOAD.parsed.agents.defaults.models
    );
    expect(result.normalized.agents.defaults.model.primary).toBe(
      "litellm/openclaw-smart-router"
    );
  });

  it("creates the missing model branch when saving a selected primary model", async () => {
    const missingModelBranchPayload = {
      path: "/tmp/openclaw.json",
      exists: true,
      baseHash: "hash-2",
      parsed: {
        agents: {
          defaults: {},
        },
      },
    };

    const send = vi.fn(async (method: string, params?: JsonValue) => {
      if (method === "config.get") {
        if (!send.mock.calls.some(([called]) => called === "config.set")) {
          return missingModelBranchPayload as unknown as JsonValue;
        }

        return {
          ...missingModelBranchPayload,
          parsed: {
            agents: {
              defaults: {
                model: {
                  primary: "openrouter/openai/gpt-4o-mini",
                },
              },
            },
          },
        } as JsonValue;
      }

      if (method === "config.set") {
        return { ok: true, received: params } as JsonValue;
      }

      throw new Error(`Unexpected method: ${method}`);
    });

    await saveModelSelection(send, {
      primaryModel: "openrouter/openai/gpt-4o-mini",
    });

    const configSetCall = send.mock.calls.find(([method]) => method === "config.set");
    const params = (configSetCall?.[1] ?? {}) as { raw?: string };
    const parsed = JSON.parse(params.raw ?? "{}") as {
      agents?: {
        defaults?: {
          model?: {
            primary?: string;
          };
        };
      };
    };

    expect(parsed.agents?.defaults?.model?.primary).toBe(
      "openrouter/openai/gpt-4o-mini"
    );
  });

  it("propagates save failures", async () => {
    const send = vi.fn(async (method: string) => {
      if (method === "config.get") {
        return CONFIG_GET_PAYLOAD as unknown as JsonValue;
      }

      if (method === "config.set") {
        throw new Error("write rejected");
      }

      throw new Error(`Unexpected method: ${method}`);
    });

    await expect(
      saveModelSelection(send, {
        primaryModel: "litellm/openclaw-smart-router",
      })
    ).rejects.toThrow("write rejected");
  });
});