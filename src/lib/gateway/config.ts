import type { JsonValue } from "@/lib/gateway/types";

export type ConfigPath = string | string[];

export type ConfigPatchOperation =
  | { op: "set"; path: ConfigPath; value: JsonValue }
  | { op: "unset"; path: ConfigPath }
  | { op: "merge"; path: ConfigPath; value: Record<string, JsonValue> };

export type NormalizedOpenClawConfig = {
  source: Record<string, unknown>;
  meta: {
    lastTouchedVersion: string | null;
    lastTouchedAt: string | null;
  };
  wizard: {
    lastRunAt: string | null;
    lastRunVersion: string | null;
    lastRunCommand: string | null;
    lastRunMode: string | null;
  };
  browser: {
    enabled: boolean;
    defaultProfile: string | null;
    profiles: Record<string, unknown>;
    ssrfPolicy: Record<string, unknown>;
  };
  auth: {
    profiles: Record<string, unknown>;
  };
  models: {
    mode: string;
    providers: Record<string, unknown>;
  };
  agents: {
    defaults: {
      model: {
        primary: string | null;
      };
      models: Record<string, unknown>;
      workspace: string | null;
      compactionMode: string | null;
      sandboxMode: string | null;
      maxConcurrent: number | null;
      subagentsMaxConcurrent: number | null;
    };
    list: unknown[];
  };
  tools: {
    profile: string | null;
    webFetch: Record<string, unknown>;
  };
  commands: {
    native: string | null;
    nativeSkills: string | null;
    restart: boolean | null;
    ownerDisplay: string | null;
  };
  session: {
    dmScope: string | null;
  };
  hooks: {
    internalEnabled: boolean | null;
    entries: Record<string, unknown>;
  };
  gateway: {
    mode: string;
    bind: string;
    port: number | null;
    controlUi: Record<string, unknown>;
    auth: Record<string, unknown>;
    tailscale: Record<string, unknown>;
    nodes: Record<string, unknown>;
  };
  channels: Record<string, unknown>;
  skills: {
    load: Record<string, unknown>;
    install: Record<string, unknown>;
    entries: Record<string, unknown>;
  };
  plugins: {
    entries: Record<string, unknown>;
  };
  messages: {
    ackReactionScope: string | null;
  };
};

export type GatewayConfigSnapshot = {
  path: string | null;
  exists: boolean;
  raw: string | null;
  baseHash: string | null;
  normalized: NormalizedOpenClawConfig;
};

export type ConfigPatchPayload = {
  set: Record<string, JsonValue>;
  unset: string[];
  merge: Record<string, Record<string, JsonValue>>;
};

export type GatewaySendFn = (
  method: string,
  params?: JsonValue
) => Promise<JsonValue>;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cloneRecord<T extends Record<string, unknown>>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function toPathSegments(path: ConfigPath): string[] {
  if (Array.isArray(path)) {
    return path.map((segment) => segment.trim()).filter(Boolean);
  }

  return path
    .split(".")
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function toDotPath(path: ConfigPath): string {
  return toPathSegments(path).join(".");
}

function getPathValue(
  source: Record<string, unknown>,
  path: ConfigPath
): unknown {
  const segments = toPathSegments(path);
  let current: unknown = source;

  for (const segment of segments) {
    if (!isObject(current)) {
      return undefined;
    }

    current = current[segment];
  }

  return current;
}

function setPathValue(
  source: Record<string, unknown>,
  path: ConfigPath,
  value: JsonValue
): void {
  const segments = toPathSegments(path);
  if (segments.length === 0) {
    return;
  }

  let current: Record<string, unknown> = source;

  for (const segment of segments.slice(0, -1)) {
    const next = current[segment];
    if (!isObject(next)) {
      const created: Record<string, unknown> = {};
      current[segment] = created;
      current = created;
      continue;
    }

    current = next;
  }

  current[segments[segments.length - 1]] = value;
}

function unsetPathValue(source: Record<string, unknown>, path: ConfigPath): void {
  const segments = toPathSegments(path);
  if (segments.length === 0) {
    return;
  }

  let current: Record<string, unknown> = source;

  for (const segment of segments.slice(0, -1)) {
    const next = current[segment];
    if (!isObject(next)) {
      return;
    }

    current = next;
  }

  delete current[segments[segments.length - 1]];
}

function mergePathValue(
  source: Record<string, unknown>,
  path: ConfigPath,
  value: Record<string, JsonValue>
): void {
  const current = getPathValue(source, path);
  const next = isObject(current) ? { ...current } : {};

  for (const [key, entry] of Object.entries(value)) {
    next[key] = entry;
  }

  setPathValue(source, path, next as JsonValue);
}

function normalizePayloadEnvelope(payload: unknown): Record<string, unknown> {
  if (!isObject(payload)) {
    return {};
  }

  if (isObject(payload.payload)) {
    return payload.payload;
  }

  return payload;
}

function normalizeParsedConfig(payload: Record<string, unknown>): Record<string, unknown> {
  if (isObject(payload.config)) {
    return cloneRecord(payload.config);
  }

  if (isObject(payload.resolved)) {
    return cloneRecord(payload.resolved);
  }

  if (isObject(payload.parsed)) {
    return cloneRecord(payload.parsed);
  }

  return {};
}

export function normalizeGatewayConfig(payload: unknown): GatewayConfigSnapshot {
  const envelope = normalizePayloadEnvelope(payload);
  const source = normalizeParsedConfig(envelope);

  const meta = isObject(source.meta) ? source.meta : {};
  const wizard = isObject(source.wizard) ? source.wizard : {};
  const browser = isObject(source.browser) ? source.browser : {};
  const models = isObject(source.models) ? source.models : {};
  const auth = isObject(source.auth) ? source.auth : {};
  const agents = isObject(source.agents) ? source.agents : {};
  const defaults = isObject(agents.defaults) ? agents.defaults : {};
  const modelDefaults = isObject(defaults.model) ? defaults.model : {};
  const compaction = isObject(defaults.compaction) ? defaults.compaction : {};
  const sandbox = isObject(defaults.sandbox) ? defaults.sandbox : {};
  const subagents = isObject(defaults.subagents) ? defaults.subagents : {};
  const tools = isObject(source.tools) ? source.tools : {};
  const web = isObject(tools.web) ? tools.web : {};
  const fetch = isObject(web.fetch) ? web.fetch : {};
  const commands = isObject(source.commands) ? source.commands : {};
  const session = isObject(source.session) ? source.session : {};
  const hooks = isObject(source.hooks) ? source.hooks : {};
  const internalHooks = isObject(hooks.internal) ? hooks.internal : {};
  const gateway = isObject(source.gateway) ? source.gateway : {};
  const skills = isObject(source.skills) ? source.skills : {};
  const plugins = isObject(source.plugins) ? source.plugins : {};
  const messages = isObject(source.messages) ? source.messages : {};

  const normalized: NormalizedOpenClawConfig = {
    source,
    meta: {
      lastTouchedVersion: readString(meta.lastTouchedVersion),
      lastTouchedAt: readString(meta.lastTouchedAt),
    },
    wizard: {
      lastRunAt: readString(wizard.lastRunAt),
      lastRunVersion: readString(wizard.lastRunVersion),
      lastRunCommand: readString(wizard.lastRunCommand),
      lastRunMode: readString(wizard.lastRunMode),
    },
    browser: {
      enabled: readBoolean(browser.enabled) ?? false,
      defaultProfile: readString(browser.defaultProfile),
      profiles: isObject(browser.profiles) ? browser.profiles : {},
      ssrfPolicy: isObject(browser.ssrfPolicy) ? browser.ssrfPolicy : {},
    },
    auth: {
      profiles: isObject(auth.profiles) ? auth.profiles : {},
    },
    models: {
      mode: readString(models.mode) ?? "merge",
      providers: isObject(models.providers) ? models.providers : {},
    },
    agents: {
      defaults: {
        model: {
          primary: readString(modelDefaults.primary),
        },
        models: isObject(defaults.models) ? defaults.models : {},
        workspace: readString(defaults.workspace),
        compactionMode: readString(compaction.mode),
        sandboxMode: readString(sandbox.mode),
        maxConcurrent: readNumber(defaults.maxConcurrent),
        subagentsMaxConcurrent: readNumber(subagents.maxConcurrent),
      },
      list: Array.isArray(agents.list) ? agents.list : [],
    },
    tools: {
      profile: readString(tools.profile),
      webFetch: fetch,
    },
    commands: {
      native: readString(commands.native),
      nativeSkills: readString(commands.nativeSkills),
      restart: readBoolean(commands.restart),
      ownerDisplay: readString(commands.ownerDisplay),
    },
    session: {
      dmScope: readString(session.dmScope),
    },
    hooks: {
      internalEnabled: readBoolean(internalHooks.enabled),
      entries: isObject(internalHooks.entries) ? internalHooks.entries : {},
    },
    gateway: {
      mode: readString(gateway.mode) ?? "local",
      bind: readString(gateway.bind) ?? "lan",
      port: readNumber(gateway.port),
      controlUi: isObject(gateway.controlUi) ? gateway.controlUi : {},
      auth: isObject(gateway.auth) ? gateway.auth : {},
      tailscale: isObject(gateway.tailscale) ? gateway.tailscale : {},
      nodes: isObject(gateway.nodes) ? gateway.nodes : {},
    },
    channels: isObject(source.channels) ? source.channels : {},
    skills: {
      load: isObject(skills.load) ? skills.load : {},
      install: isObject(skills.install) ? skills.install : {},
      entries: isObject(skills.entries) ? skills.entries : {},
    },
    plugins: {
      entries: isObject(plugins.entries) ? plugins.entries : {},
    },
    messages: {
      ackReactionScope: readString(messages.ackReactionScope),
    },
  };

  return {
    path: readString(envelope.path),
    exists:
      typeof envelope.exists === "boolean"
        ? envelope.exists
        : Object.keys(source).length > 0,
    raw: readString(envelope.raw),
    baseHash: readString(envelope.baseHash) ?? readString(envelope.hash),
    normalized,
  };
}

export function applyConfigPatch(
  source: Record<string, unknown>,
  operations: ConfigPatchOperation[]
): Record<string, unknown> {
  const next = cloneRecord(source);

  for (const operation of operations) {
    if (operation.op === "set") {
      setPathValue(next, operation.path, operation.value);
      continue;
    }

    if (operation.op === "unset") {
      unsetPathValue(next, operation.path);
      continue;
    }

    mergePathValue(next, operation.path, operation.value);
  }

  return next;
}

export function serializeConfigPatch(
  operations: ConfigPatchOperation[]
): ConfigPatchPayload {
  const payload: ConfigPatchPayload = {
    set: {},
    unset: [],
    merge: {},
  };

  for (const operation of operations) {
    const path = toDotPath(operation.path);
    if (!path) {
      continue;
    }

    if (operation.op === "set") {
      payload.set[path] = operation.value;
      continue;
    }

    if (operation.op === "unset") {
      payload.unset.push(path);
      continue;
    }

    payload.merge[path] = operation.value;
  }

  return payload;
}

export function normalizeModelIdentifier(reference: string | null): string | null {
  if (!reference) {
    return null;
  }

  const normalized = reference.trim();
  if (!normalized) {
    return null;
  }

  const slashIndex = normalized.indexOf("/");
  if (slashIndex < 0) {
    return normalized;
  }

  const modelId = normalized.slice(slashIndex + 1).trim();
  return modelId || null;
}

export function toPrimaryModelReference(
  modelId: string,
  provider: string
): string {
  const normalizedModelId = modelId.trim();
  const normalizedProvider = provider.trim();

  if (normalizedModelId.includes("/")) {
    return normalizedModelId;
  }

  if (!normalizedProvider) {
    return normalizedModelId;
  }

  return `${normalizedProvider}/${normalizedModelId}`;
}

export function toConfigServiceError(
  scope: "load" | "save",
  error: unknown
): Error {
  const detail = error instanceof Error ? error.message : "Unknown gateway error";
  const prefix = scope === "load" ? "Failed to load gateway config" : "Failed to save gateway config";
  return new Error(`${prefix}: ${detail}`);
}

export function createGatewayConfigService(send: GatewaySendFn) {
  return {
    async load(): Promise<GatewayConfigSnapshot> {
      try {
        const payload = await send("config.get", {});
        return normalizeGatewayConfig(payload);
      } catch (error) {
        throw toConfigServiceError("load", error);
      }
    },
    async update(operations: ConfigPatchOperation[]): Promise<GatewayConfigSnapshot> {
      const current = await this.load();
      const nextConfig = applyConfigPatch(current.normalized.source, operations);

      try {
        await send("config.set", {
          raw: JSON.stringify(nextConfig, null, 2),
          ...(current.baseHash !== null ? { baseHash: current.baseHash } : {}),
        } as JsonValue);
      } catch (error) {
        throw toConfigServiceError("save", error);
      }

      return this.load();
    },
  };
}
