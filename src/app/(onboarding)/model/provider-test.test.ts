import { afterEach, describe, expect, it, vi } from "vitest";

import {
  testProviderModel,
  validateModelIdentifier,
  validateProviderApiKey,
} from "./provider-test";

const originalFetch = global.fetch;

describe("onboarding provider test adapter", () => {
  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("requires API key before calling the API", async () => {
    const result = await testProviderModel({
      provider: "openai",
      apiKey: "   ",
      modelId: "gpt-4.1-mini",
    });

    expect(validateProviderApiKey("   ")).toBe("Enter an API key before testing.");
    expect(result.status).toBe("failure");
    expect(result.message).toBe("Enter an API key before testing.");
    expect(result.evidence).toBeNull();
  });

  it("requires exact model name before calling the API", async () => {
    const result = await testProviderModel({
      provider: "openai",
      apiKey: "sk-test",
      modelId: "   ",
    });

    expect(validateModelIdentifier("   ")).toBe(
      "Enter an exact model name before testing."
    );
    expect(result.status).toBe("failure");
    expect(result.message).toBe("Enter an exact model name before testing.");
    expect(result.evidence).toBeNull();
  });

  it("returns success result with validation evidence", async () => {
    global.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    ) as typeof fetch;

    const result = await testProviderModel({
      provider: "openrouter",
      apiKey: "sk-test-1234",
      modelId: "openai/gpt-4o-mini",
    });

    expect(result.status).toBe("success");
    expect(result.evidence).not.toBeNull();
    expect(result.evidence?.provider).toBe("openrouter");
    expect(result.evidence?.modelId).toBe("openai/gpt-4o-mini");
  });

  it("returns failure result when API responds with an error", async () => {
    global.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ error: "Authentication failed for openai." }), {
        status: 400,
      })
    ) as typeof fetch;

    const result = await testProviderModel({
      provider: "openai",
      apiKey: "sk-invalid",
      modelId: "gpt-4.1-mini",
    });

    expect(result.status).toBe("failure");
    expect(result.message).toBe("Authentication failed for openai.");
    expect(result.evidence).toBeNull();
  });
});
