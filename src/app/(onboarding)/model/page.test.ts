import { describe, expect, it } from "vitest";

import {
  extractDefaultSessionModelId,
  extractSessionModelList,
  findModelOptionByIdentifier,
  formatModelOptionLabel,
  loadSessionModels,
  mergeSessionModels,
  normalizeModelIdentifier,
  resolveSelectedModelId,
} from "./selection";

describe("onboarding model selection", () => {
  it("normalizes model identifiers", () => {
    expect(normalizeModelIdentifier(" OPENAI/GPT-4O-MINI ")).toBe(
      "openai/gpt-4o-mini"
    );
  });

  it("matches selected models by normalized identifier", () => {
    const models = [
      {
        id: "litellm/openclaw-smart-router",
        name: "openclaw-smart-router",
        provider: "litellm",
      },
    ];

    expect(
      findModelOptionByIdentifier(models, " LITELLM/OPENCLAW-SMART-ROUTER ")
    ).toEqual(models[0]);
    expect(findModelOptionByIdentifier(models, "unknown/model")).toBeNull();
  });

  it("keeps existing selection when model still exists", () => {
    const models = [
      {
        id: "litellm/openclaw-smart-router",
        name: "openclaw-smart-router",
        provider: "litellm",
      },
      {
        id: "openrouter/openai/gpt-4o-mini",
        name: "GPT-4o mini",
        provider: "openrouter",
      },
    ];

    expect(
      resolveSelectedModelId({
        defaultModelId: "openrouter/openai/gpt-4o-mini",
        models,
      })
    ).toBe("openrouter/openai/gpt-4o-mini");
  });

  it("defaults to first model when default is missing", () => {
    const models = [
      {
        id: "litellm/openclaw-smart-router",
        name: "openclaw-smart-router",
        provider: "litellm",
      },
      {
        id: "openrouter/openai/gpt-4o-mini",
        name: "GPT-4o mini",
        provider: "openrouter",
      },
    ];

    expect(
      resolveSelectedModelId({
        defaultModelId: "anthropic/claude-3.5-sonnet",
        models,
      })
    ).toBe("litellm/openclaw-smart-router");
  });

  it("returns empty selection when no models are available", () => {
    expect(
      resolveSelectedModelId({
        defaultModelId: null,
        models: [],
      })
    ).toBe("");
  });

  it("extracts default session model id from payload defaults", () => {
    expect(extractDefaultSessionModelId(null)).toBeNull();
    expect(
      extractDefaultSessionModelId({
        payload: {
          defaults: {
            model: "openclaw-smart-router",
            modelProvider: "litellm",
          },
        },
      })
    ).toBe("litellm/openclaw-smart-router");
  });

  it("extracts session model list from sessions payload", () => {
    expect(extractSessionModelList(null)).toEqual([]);
    expect(
      extractSessionModelList({
        payload: {
          sessions: [
            {
              model: "openclaw-smart-router",
              modelProvider: "litellm",
            },
          ],
        },
      })
    ).toEqual([
      {
        id: "litellm/openclaw-smart-router",
        name: "openclaw-smart-router",
        provider: "litellm",
      },
    ]);
  });

  it("merges default model with session models and deduplicates by id", () => {
    const merged = mergeSessionModels(
      "litellm/openclaw-smart-router",
      [
        {
          id: "openrouter/openai/gpt-4o-mini",
          name: "GPT-4o mini",
          provider: "openrouter",
        },
        {
          id: "litellm/openclaw-smart-router",
          name: "OpenClaw Smart Router",
          provider: "openrouter",
        },
      ]
    );

    expect(merged[0].id).toBe("litellm/openclaw-smart-router");
    expect(merged).toHaveLength(2);
  });

  it("adds the current primary model as a fallback option when discovery misses it", () => {
    expect(
      mergeSessionModels("openrouter/openai/gpt-4o-mini", [
        {
          id: "litellm/openclaw-smart-router",
          name: "openclaw-smart-router",
          provider: "litellm",
        },
      ])
    ).toEqual([
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

  it("formats dropdown labels with provider context", () => {
    expect(
      formatModelOptionLabel({
        id: "openrouter/openai/gpt-4o-mini",
        name: "GPT-4o mini",
        provider: "openrouter",
      })
    ).toBe("GPT-4o mini (openrouter)");
  });

  it("loads session models from gateway send function", async () => {
    const sendValid = async () => ({
      payload: {
        defaults: {
          model: "openclaw-smart-router",
          modelProvider: "litellm",
        },
        sessions: [
          {
            model: "openclaw-smart-router",
            modelProvider: "litellm",
          },
        ],
      },
    });

    await expect(loadSessionModels(sendValid)).resolves.toEqual({
      defaultModelId: "litellm/openclaw-smart-router",
      models: [
        {
          id: "litellm/openclaw-smart-router",
          name: "openclaw-smart-router",
          provider: "litellm",
        },
      ],
    });

    const sendThrows = async () => {
      throw new Error("network");
    };
    await expect(loadSessionModels(sendThrows)).resolves.toEqual({
      defaultModelId: null,
      models: [],
    });
  });
});
