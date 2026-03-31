import { NextResponse } from "next/server";

type ProviderId =
  | "openai"
  | "google"
  | "anthropic"
  | "openrouter"
  | "litellm";

const DEFAULT_LITELLM_BASE_URL = "http://localhost:4000";

type ModelTestRequest = {
  provider?: unknown;
  modelId?: unknown;
  apiKey?: unknown;
};

function isProviderId(value: unknown): value is ProviderId {
  return (
    value === "openai" ||
    value === "google" ||
    value === "anthropic" ||
    value === "openrouter" ||
    value === "litellm"
  );
}

function readNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toErrorMessage(status: number, provider: ProviderId): string {
  if (status === 401 || status === 403) {
    return `Authentication failed for ${provider}.`;
  }

  if (status === 404) {
    return `Model test endpoint returned not found for ${provider}.`;
  }

  if (status === 429) {
    return `Rate limited while testing ${provider}.`;
  }

  return `Model test failed for ${provider} (${status}).`;
}

async function testProviderModel(
  provider: ProviderId,
  modelId: string,
  apiKey: string
): Promise<{ ok: true } | { ok: false; status: number }> {
  if (provider === "openai") {
    const response = await fetch(
      `https://api.openai.com/v1/models/${encodeURIComponent(modelId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        cache: "no-store",
      }
    );

    return response.ok ? { ok: true } : { ok: false, status: response.status };
  }

  if (provider === "google") {
    const modelPath = modelId.startsWith("models/") ? modelId : `models/${modelId}`;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${modelPath}?key=${encodeURIComponent(apiKey)}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

    return response.ok ? { ok: true } : { ok: false, status: response.status };
  }

  if (provider === "anthropic") {
    const response = await fetch("https://api.anthropic.com/v1/models", {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      cache: "no-store",
    });

    return response.ok ? { ok: true } : { ok: false, status: response.status };
  }

  if (provider === "openrouter") {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
    });

    return response.ok ? { ok: true } : { ok: false, status: response.status };
  }

  const baseUrl =
    process.env.LITELLM_BASE_URL?.trim() || DEFAULT_LITELLM_BASE_URL;
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
  const liteLlmResponse = await fetch(`${normalizedBaseUrl}/v1/models`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    cache: "no-store",
  });

  return liteLlmResponse.ok
    ? { ok: true }
    : { ok: false, status: liteLlmResponse.status };
}

export async function POST(request: Request) {
  let body: ModelTestRequest;

  try {
    body = (await request.json()) as ModelTestRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const provider = body.provider;
  const modelId = readNonEmptyString(body.modelId);
  const apiKey = readNonEmptyString(body.apiKey);

  if (!isProviderId(provider)) {
    return NextResponse.json({ error: "Provider is required." }, { status: 400 });
  }

  if (!modelId) {
    return NextResponse.json({ error: "Model is required." }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required." }, { status: 400 });
  }

  try {
    const result = await testProviderModel(provider, modelId, apiKey);

    if (!result.ok) {
      return NextResponse.json(
        { error: toErrorMessage(result.status, provider) },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, provider, modelId }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: `Unable to reach ${provider} test endpoint.` },
      { status: 502 }
    );
  }
}
