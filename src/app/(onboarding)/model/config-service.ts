import {
  applyConfigPatch,
  createGatewayConfigService,
  type ConfigPatchOperation,
  type GatewayConfigSnapshot,
} from "@/lib/gateway/config";

import {
  extractModelNameFromReference,
  extractProviderFromReference,
  isObject,
  mergeSessionModels,
  resolveSelectedModelId,
  type ModelOption,
  type SendFn,
} from "./selection";

export type LoadedModelStepState = {
  selectedModelId: string;
  modelOptions: ModelOption[];
  config: GatewayConfigSnapshot;
};

function readNonEmptyString(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function readModelRegistry(
  source: Record<string, unknown>
): Record<string, unknown> | unknown[] | null {
  const agents = isObject(source.agents) ? source.agents : null;
  if (!agents) {
    return null;
  }

  if (isObject(agents.models) || Array.isArray(agents.models)) {
    return agents.models;
  }

  const defaults = isObject(agents.defaults) ? agents.defaults : null;
  if (!defaults) {
    return null;
  }

  return isObject(defaults.models) || Array.isArray(defaults.models)
    ? defaults.models
    : null;
}

function toModelOptionFromEntry(
  modelReference: string,
  value: unknown
): ModelOption {
  const metadata = isObject(value) ? value : null;

  return {
    id: modelReference,
    name:
      (metadata && typeof metadata.name === "string" && metadata.name.trim()) ||
      extractModelNameFromReference(modelReference),
    provider: extractProviderFromReference(modelReference),
  };
}

function extractConfigModelOptions(snapshot: GatewayConfigSnapshot): ModelOption[] {
  const registry = readModelRegistry(snapshot.normalized.source);

  if (!registry) {
    return [];
  }

  if (Array.isArray(registry)) {
    return registry
      .filter(isObject)
      .map((entry) => {
        const modelReference =
          (typeof entry.id === "string" && entry.id.trim()) ||
          (typeof entry.model === "string" && entry.model.trim()) ||
          (typeof entry.ref === "string" && entry.ref.trim()) ||
          null;

        return modelReference ? toModelOptionFromEntry(modelReference, entry) : null;
      })
      .filter((entry): entry is ModelOption => entry !== null);
  }

  return Object.entries(registry)
    .filter(([modelReference]) => modelReference.trim().length > 0)
    .map(([modelReference, value]) => toModelOptionFromEntry(modelReference, value));
}

export async function loadModelStepState(send: SendFn): Promise<LoadedModelStepState> {
  const configService = createGatewayConfigService(send);
  const config = await configService.load();

  const savedPrimaryModel = readNonEmptyString(
    config.normalized.agents.defaults.model.primary
  );
  const modelOptions = mergeSessionModels(
    savedPrimaryModel,
    extractConfigModelOptions(config)
  );
  const selectedModelId = resolveSelectedModelId({
    defaultModelId: savedPrimaryModel,
    models: modelOptions,
  });

  return {
    selectedModelId,
    modelOptions,
    config,
  };
}

export async function saveModelSelection(
  send: SendFn,
  input: {
    primaryModel: string;
  }
): Promise<GatewayConfigSnapshot> {
  const primaryModel = readNonEmptyString(input.primaryModel);
  if (!primaryModel) {
    throw new Error("Select a primary model before saving.");
  }

  const configService = createGatewayConfigService(send);
  const currentConfig = await configService.load();
  const operations = [
    {
      op: "set" as const,
      path: "agents.defaults.model.primary",
      value: primaryModel,
    },
  ] satisfies ConfigPatchOperation[];

  const nextSource = applyConfigPatch(currentConfig.normalized.source, operations);

  await send("config.set", {
    raw: JSON.stringify(nextSource, null, 2),
    ...(currentConfig.baseHash !== null ? { baseHash: currentConfig.baseHash } : {}),
  });

  return configService.load();
}