import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/gateway/model-test/route";

const originalFetch = global.fetch;

describe("POST /api/gateway/model-test", () => {
  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("rejects invalid request payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/gateway/model-test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider: "openai", modelId: "gpt-4.1-mini" }),
      })
    );

    expect(response.status).toBe(400);
  });

  it("returns success when upstream provider test succeeds", async () => {
    global.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ id: "model" }), { status: 200 })
    ) as typeof fetch;

    const response = await POST(
      new Request("http://localhost/api/gateway/model-test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          provider: "openai",
          modelId: "gpt-4.1-mini",
          apiKey: "sk-test",
        }),
      })
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as { ok?: boolean };
    expect(payload.ok).toBe(true);
  });

  it("maps provider auth failure to actionable message", async () => {
    global.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 })
    ) as typeof fetch;

    const response = await POST(
      new Request("http://localhost/api/gateway/model-test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          provider: "openrouter",
          modelId: "openai/gpt-4o-mini",
          apiKey: "sk-invalid",
        }),
      })
    );

    expect(response.status).toBe(400);
    const payload = (await response.json()) as { error?: string };
    expect(payload.error).toBe("Authentication failed for openrouter.");
  });

  it("supports litellm provider model testing", async () => {
    global.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ data: [] }), { status: 200 })
    ) as typeof fetch;

    const response = await POST(
      new Request("http://localhost/api/gateway/model-test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          provider: "litellm",
          modelId: "openclaw-smart-router",
          apiKey: "sk-litellm",
        }),
      })
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      ok?: boolean;
      provider?: string;
      modelId?: string;
    };
    expect(payload.ok).toBe(true);
    expect(payload.provider).toBe("litellm");
    expect(payload.modelId).toBe("openclaw-smart-router");
  });
});
