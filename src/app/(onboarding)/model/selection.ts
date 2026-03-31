import {
  normalizeModelIdentifier as extractModelIdFromReference,
  toPrimaryModelReference,
} from "@/lib/gateway/config";
import type { JsonValue } from "@/lib/gateway/types";

export type ModelOption = {
  id: string;
  name: string;
  provider: string;
};

export type SessionModelData = {
  defaultModelId: string | null;
  models: ModelOption[];
};

type ResolveSelectedModelInput = {
  defaultModelId: string | null;
  models: ModelOption[];
};

export type SendFn = (
  method: string,
  params?: JsonValue
) => Promise<JsonValue>;

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readStringField(
  object: Record<string, unknown>,
  key: string
): string | null {
  const value = object[key];
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function extractProviderFromReference(reference: string): string {
  const normalized = reference.trim();
  if (!normalized) {
    return "unknown";
  }

  const separator = normalized.indexOf("/");
  return separator > 0 ? normalized.slice(0, separator) : "unknown";
}

export function extractModelNameFromReference(reference: string): string {
  return extractModelIdFromReference(reference) ?? reference.trim();
}

function buildFallbackModelOption(primaryModelId: string): ModelOption {
  return {
    id: primaryModelId.trim(),
    name: extractModelNameFromReference(primaryModelId),
    provider: extractProviderFromReference(primaryModelId),
  };
}

function normalizeSessionModel(item: Record<string, unknown>): ModelOption | null {
  const model = readStringField(item, "model") ?? readStringField(item, "id");
  if (!model) {
    return null;
  }

  const provider =
    readStringField(item, "modelProvider") ??
    readStringField(item, "provider") ??
    extractProviderFromReference(model);
  const id =
    provider === "unknown" ? model : toPrimaryModelReference(model, provider);

  return {
    id,
    name: readStringField(item, "name") ?? extractModelNameFromReference(id),
    provider,
  };
}

export function extractDefaultSessionModelId(payload: unknown): string | null {
  if (!isObject(payload)) {
    return null;
  }

  const source =
    isObject(payload.payload) && !Array.isArray(payload.payload)
      ? payload.payload
      : payload;

  if (!isObject(source.defaults)) {
    return null;
  }

  const model = readStringField(source.defaults, "model");
  if (!model) {
    return null;
  }

  const provider = readStringField(source.defaults, "modelProvider");
  return provider ? toPrimaryModelReference(model, provider) : model;
}

export function extractSessionModelList(payload: unknown): ModelOption[] {
  if (!isObject(payload)) {
    return [];
  }

  const source =
    isObject(payload.payload) && !Array.isArray(payload.payload)
      ? payload.payload
      : payload;

  if (!Array.isArray(source.sessions)) {
    return [];
  }

  return source.sessions
    .filter(isObject)
    .map((item) => normalizeSessionModel(item))
    .filter((item): item is ModelOption => item !== null);
}

export function mergeSessionModels(
  defaultModelId: string | null,
  models: ModelOption[]
): ModelOption[] {
  const defaultModel = defaultModelId
    ? findModelOptionByIdentifier(models, defaultModelId) ??
      buildFallbackModelOption(defaultModelId)
    : null;

  const merged = [
    defaultModel,
    ...models,
  ].filter((item): item is ModelOption => item !== null);

  const seen = new Set<string>();
  return merged.filter((model) => {
    const normalizedId = normalizeModelIdentifier(model.id);
    if (!normalizedId || seen.has(normalizedId)) {
      return false;
    }

    seen.add(normalizedId);
    return true;
  });
}

export async function loadSessionModels(send: SendFn): Promise<SessionModelData> {
  try {
    const response = await send("sessions.list", {
      includeGlobal: true,
      includeUnknown: false,
      limit: 120,
    });

    const defaultModelId = extractDefaultSessionModelId(response);
    const models = mergeSessionModels(defaultModelId, extractSessionModelList(response));

    return {
      defaultModelId,
      models,
    };
  } catch {
    return {
      defaultModelId: null,
      models: [],
    };
  }
}

export function normalizeModelIdentifier(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function findModelOptionByIdentifier(
  models: ModelOption[],
  modelId: string
): ModelOption | null {
  const normalizedModelId = normalizeModelIdentifier(modelId);
  if (!normalizedModelId) {
    return null;
  }

  return (
    models.find(
      (model) => normalizeModelIdentifier(model.id) === normalizedModelId
    ) ?? null
  );
}

export function formatModelOptionLabel(model: ModelOption): string {
  return model.provider === "unknown"
    ? model.name
    : `${model.name} (${model.provider})`;
}

export function resolveSelectedModelId({
  defaultModelId,
  models,
}: ResolveSelectedModelInput): string {
  const defaultModel = findModelOptionByIdentifier(models, defaultModelId ?? "");
  if (defaultModel) {
    return defaultModel.id;
  }

  return models[0]?.id ?? "";
}
