import {
  fingerprintApiKey,
  type ProviderId,
} from "./providers";

export type ProviderValidationEvidence = {
  provider: ProviderId;
  modelId: string;
  apiKeyFingerprint: string;
  validatedAt: string;
};

export type ProviderTestResult = {
  status: "success" | "failure";
  message: string;
  provider: ProviderId;
  modelId: string;
  evidence: ProviderValidationEvidence | null;
};

export function validateProviderApiKey(apiKey: string): string | null {
  if (!apiKey.trim()) {
    return "Enter an API key before testing.";
  }

  return null;
}

export function validateModelIdentifier(modelId: string): string | null {
  if (!modelId.trim()) {
    return "Enter an exact model name before testing.";
  }

  return null;
}

function parseErrorMessage(payload: unknown): string {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return "Model test failed.";
  }

  const record = payload as Record<string, unknown>;
  const error = record.error;
  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  return "Model test failed.";
}

export async function testProviderModel(input: {
  provider: ProviderId;
  modelId: string;
  apiKey: string;
}): Promise<ProviderTestResult> {
  const provider = input.provider;
  const modelId = input.modelId.trim();
  const apiKey = input.apiKey.trim();
  const modelValidationError = validateModelIdentifier(modelId);
  if (modelValidationError) {
    return {
      status: "failure",
      message: modelValidationError,
      provider,
      modelId,
      evidence: null,
    };
  }

  const validationError = validateProviderApiKey(apiKey);

  if (validationError) {
    return {
      status: "failure",
      message: validationError,
      provider,
      modelId,
      evidence: null,
    };
  }

  const apiKeyFingerprint = fingerprintApiKey(apiKey);

  try {
    const response = await fetch("/api/gateway/model-test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ provider, modelId, apiKey }),
    });

    const payload = (await response.json().catch(() => null)) as unknown;

    if (!response.ok) {
      return {
        status: "failure",
        message: parseErrorMessage(payload),
        provider,
        modelId,
        evidence: null,
      };
    }

    return {
      status: "success",
      message: "Model test successful.",
      provider,
      modelId,
      evidence: {
        provider,
        modelId,
        apiKeyFingerprint,
        validatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    const message =
      error instanceof Error && error.message.trim().length > 0
        ? error.message
        : "Model test failed.";

    return {
      status: "failure",
      message,
      provider,
      modelId,
      evidence: null,
    };
  }
}
