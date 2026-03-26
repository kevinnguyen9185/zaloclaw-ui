import {
  createGatewayConfigService,
  normalizeModelIdentifier,
  toPrimaryModelReference,
  type GatewayConfigSnapshot,
} from "@/lib/gateway/config";

import {
  resolveSelectedModelId,
  type ModelOption,
  type SendFn,
} from "./selection";

export type LoadedModelStepState = {
  models: ModelOption[];
  selectedModelId: string;
  config: GatewayConfigSnapshot;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readStringValue(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function extractModelsFromConfig(modelsRecord: Record<string, unknown>): ModelOption[] {
  return Object.entries(modelsRecord).flatMap(([key, value]) => {
    const slashIndex = key.indexOf("/");
    const provider = slashIndex >= 0 ? key.slice(0, slashIndex) : "unknown";
    const modelId = slashIndex >= 0 ? key.slice(slashIndex + 1) : key;
    if (!modelId) return [];
    const meta = isObject(value) ? value : {};
    const name = readStringValue(meta.name) ?? modelId;
    return [{ id: modelId, name, provider }];
  });
}

export async function loadModelStepState(send: SendFn): Promise<LoadedModelStepState> {
  const configService = createGatewayConfigService(send);
  const config = await configService.load();

  const models = extractModelsFromConfig(config.normalized.agents.defaults.models);
  const primaryModelId = normalizeModelIdentifier(
    config.normalized.agents.defaults.model.primary
  );

  const selectedModelId = resolveSelectedModelId({
    defaultModelId: primaryModelId,
    models,
  });

  return { models, selectedModelId, config };
}

export async function saveModelSelection(
  send: SendFn,
  input: {
    modelId: string;
    provider: string;
  }
): Promise<GatewayConfigSnapshot> {
  const configService = createGatewayConfigService(send);
  const primaryModel = toPrimaryModelReference(input.modelId, input.provider);

  return configService.update([
    {
      op: "set",
      path: "agents.defaults.model.primary",
      value: primaryModel,
    },
  ]);
}
