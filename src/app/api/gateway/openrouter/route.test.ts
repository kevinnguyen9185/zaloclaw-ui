import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { POST } from "@/app/api/gateway/openrouter/route";

describe("POST /api/gateway/openrouter", () => {
  let tempDir = "";
  let configPath = "";

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "zaloclaw-openrouter-"));
    configPath = join(tempDir, "openclaw.json");
    process.env.OPENCLAW_CONFIG_PATH = configPath;
  });

  afterEach(async () => {
    delete process.env.OPENCLAW_CONFIG_PATH;
    await rm(tempDir, { recursive: true, force: true });
  });

  it("persists the OpenRouter key and preserves existing config", async () => {
    await writeFile(
      configPath,
      JSON.stringify({
        assistantName: "ZaloClaw",
        providers: {
          openrouter: {
            baseUrl: "https://openrouter.ai/api/v1",
          },
        },
      }),
      "utf8"
    );

    const response = await POST(
      new Request("http://localhost/api/gateway/openrouter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ apiKey: "sk-or-v1-test-key-1234" }),
      })
    );

    expect(response.status).toBe(200);

    const payload = (await response.json()) as { ok?: boolean };
    expect(payload.ok).toBe(true);

    const written = JSON.parse(await readFile(configPath, "utf8")) as {
      assistantName?: string;
      providers?: {
        openrouter?: {
          apiKey?: string;
          baseUrl?: string;
        };
      };
    };

    expect(written.assistantName).toBe("ZaloClaw");
    expect(written.providers?.openrouter?.baseUrl).toBe(
      "https://openrouter.ai/api/v1"
    );
    expect(written.providers?.openrouter?.apiKey).toBe("sk-or-v1-test-key-1234");
  });

  it("allows retry after a failed save caused by invalid JSON", async () => {
    const apiKey = "sk-or-v1-test-key-9876";
    await writeFile(configPath, "not-json", "utf8");

    const firstResponse = await POST(
      new Request("http://localhost/api/gateway/openrouter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ apiKey }),
      })
    );

    expect(firstResponse.status).toBe(500);

    const firstPayload = (await firstResponse.json()) as { error?: string };
    expect(firstPayload.error).toBe("Existing openclaw.json contains invalid JSON.");
    expect(firstPayload.error).not.toContain(apiKey);

    await writeFile(configPath, JSON.stringify({ providers: {} }), "utf8");

    const retryResponse = await POST(
      new Request("http://localhost/api/gateway/openrouter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ apiKey }),
      })
    );

    expect(retryResponse.status).toBe(200);
    const written = JSON.parse(await readFile(configPath, "utf8")) as {
      providers?: { openrouter?: { apiKey?: string } };
    };
    expect(written.providers?.openrouter?.apiKey).toBe(apiKey);
  });

  it("rejects empty API keys", async () => {
    const response = await POST(
      new Request("http://localhost/api/gateway/openrouter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ apiKey: "   " }),
      })
    );

    expect(response.status).toBe(400);
    const payload = (await response.json()) as { error?: string };
    expect(payload.error).toBe("Enter your OpenRouter API key.");
  });
});