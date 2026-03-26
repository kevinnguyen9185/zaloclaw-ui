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

function isObject(value: unknown): value is Record<string, unknown> {
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

function normalizeSessionModel(item: Record<string, unknown>): ModelOption | null {
  const id = readStringField(item, "model") ?? readStringField(item, "id");
  if (!id) {
    return null;
  }

  return {
    id,
    name: readStringField(item, "name") ?? id,
    provider: readStringField(item, "modelProvider") ?? readStringField(item, "provider") ?? "unknown",
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

  return readStringField(source.defaults, "model");
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
  const merged = [
    defaultModelId
      ? {
          id: defaultModelId,
          name: defaultModelId,
          provider:
            findModelOptionByIdentifier(models, defaultModelId)?.provider ?? "unknown",
        }
      : null,
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
