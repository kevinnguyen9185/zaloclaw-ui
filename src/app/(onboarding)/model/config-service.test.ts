import { describe, expect, it, vi } from "vitest";

import type { JsonValue } from "@/lib/gateway/types";

import { loadModelStepState, saveModelSelection } from "./config-service";

const CONFIG_GET_PAYLOAD = {
  path: "/tmp/openclaw.json",
  exists: true,
  parsed: {
    agents: {
      defaults: {
        model: {
          primary: "litellm/openclaw-smart-router",
        },
        models: {
          "litellm/openclaw-smart-router": { name: "OpenClaw Smart Router" },
          "openrouter/openai/gpt-4o-mini": { name: "GPT-4o Mini" },
        },
      },
    },
  },
};

describe("onboarding model config service integration", () => {
  it("loads model list from config.get agents.defaults.models", async () => {
    const send = vi.fn(async (method: string) => {
      if (method === "config.get") {
        return CONFIG_GET_PAYLOAD as unknown as JsonValue;
      }

      throw new Error(`Unexpected method: ${method}`);
    });

    const state = await loadModelStepState(send);

    expect(send).toHaveBeenCalledWith("config.get", {});
    expect(send).not.toHaveBeenCalledWith("sessions.list", expect.anything());
    expect(state.models).toHaveLength(2);
    expect(state.models[0]).toMatchObject({ id: "openclaw-smart-router", provider: "litellm", name: "OpenClaw Smart Router" });
    expect(state.models[1]).toMatchObject({ id: "openai/gpt-4o-mini", provider: "openrouter", name: "GPT-4o Mini" });
    expect(state.selectedModelId).toBe("openclaw-smart-router");
  });

  it("saves selected model via config.set only", async () => {
    const send = vi.fn(async (method: string) => {
      if (method === "config.get") {
        return CONFIG_GET_PAYLOAD as unknown as JsonValue;
      }

      if (method === "config.set") {
        return { ok: true } as JsonValue;
      }

      throw new Error(`Unexpected method: ${method}`);
    });

    await saveModelSelection(send, {
      modelId: "openclaw-smart-router",
      provider: "litellm",
    });

    expect(send).not.toHaveBeenCalledWith("sessions.patch", expect.anything());
    expect(send).toHaveBeenCalledWith(
      "config.set",
      expect.objectContaining({
        patch: expect.objectContaining({
          set: expect.objectContaining({
            "agents.defaults.model.primary": "litellm/openclaw-smart-router",
          }),
        }),
      })
    );
  });
});
