import { describe, expect, it } from "vitest";

import {
  fingerprintApiKey,
  getProviderOption,
  PROVIDER_OPTIONS,
  resolveProviderId,
} from "./providers";

describe("onboarding provider catalog", () => {
  it("includes exactly the required providers", () => {
    expect(PROVIDER_OPTIONS.map((provider) => provider.id)).toEqual([
      "openai",
      "google",
      "anthropic",
      "openrouter",
      "litellm",
    ]);
  });

  it("resolves unknown provider to default option", () => {
    expect(resolveProviderId("unknown")).toBe("openai");
  });

  it("returns configured default model per provider", () => {
    expect(getProviderOption("openai").defaultModelId).toBe("gpt-4.1-mini");
    expect(getProviderOption("google").defaultModelId).toBe("gemini-2.5-flash");
    expect(getProviderOption("anthropic").defaultModelId).toBe(
      "claude-3-5-sonnet-latest"
    );
    expect(getProviderOption("openrouter").defaultModelId).toBe(
      "openai/gpt-4o-mini"
    );
    expect(getProviderOption("litellm").defaultModelId).toBe(
      "openclaw-smart-router"
    );
  });

  it("creates stable key fingerprints for validation gating", () => {
    expect(fingerprintApiKey(" key-a ")).toBe(fingerprintApiKey("key-a"));
    expect(fingerprintApiKey("key-a")).not.toBe(fingerprintApiKey("key-b"));
  });
});
