import { describe, expect, it } from "vitest";

import {
  redactOpenRouterApiKey,
  sanitizeOpenRouterMessage,
  validateOpenRouterApiKey,
} from "@/lib/openrouter";

describe("openrouter helpers", () => {
  it("requires a non-empty API key", () => {
    expect(validateOpenRouterApiKey("   ")).toBe("Enter your OpenRouter API key.");
    expect(validateOpenRouterApiKey("sk-or-v1-test")).toBeNull();
  });

  it("redacts API keys from user-facing text", () => {
    const apiKey = "sk-or-v1-abcdefghijklmnopqrstuvwxyz";
    const redacted = redactOpenRouterApiKey(apiKey);
    const message = sanitizeOpenRouterMessage(
      `Failed to save ${apiKey} due to invalid permissions`,
      apiKey
    );

    expect(redacted).not.toBe(apiKey);
    expect(redacted).toMatch(/^sk-or-/);
    expect(redacted).toMatch(/\.{3}/);
    expect(message).toContain(redacted);
    expect(message).not.toContain(apiKey);
  });
});