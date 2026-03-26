import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const DEFAULT_OPENCLAW_CONFIG_FILE = "openclaw.json";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getOpenClawConfigPath(configPath = process.env.OPENCLAW_CONFIG_PATH): string {
  if (configPath && configPath.trim()) {
    return resolve(configPath);
  }

  return resolve(process.cwd(), DEFAULT_OPENCLAW_CONFIG_FILE);
}

/** @deprecated Use `createGatewayConfigService(...).load()` for UI config reads. */
export function parseOpenClawConfig(contents: string): Record<string, unknown> {
  if (!contents.trim()) {
    return {};
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(contents);
  } catch {
    throw new Error("Existing openclaw.json contains invalid JSON.");
  }

  if (!isObject(parsed)) {
    throw new Error("Existing openclaw.json must contain a JSON object.");
  }

  return parsed;
}

/** @deprecated Use `createGatewayConfigService(...).update()` for UI config writes. */
export function applyOpenRouterApiKey(
  config: Record<string, unknown>,
  apiKey: string
): Record<string, unknown> {
  const providers = isObject(config.providers) ? { ...config.providers } : {};
  const openrouter = isObject(providers.openrouter)
    ? { ...providers.openrouter }
    : {};

  openrouter.apiKey = apiKey;
  providers.openrouter = openrouter;

  return {
    ...config,
    providers,
  };
}

/** @deprecated Use `createGatewayConfigService(...).load()` for UI config reads. */
export async function loadOpenClawConfig(
  configPath = getOpenClawConfigPath()
): Promise<Record<string, unknown>> {
  try {
    const contents = await readFile(configPath, "utf8");
    return parseOpenClawConfig(contents);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {};
    }

    throw error;
  }
}

/** @deprecated Use `createGatewayConfigService(...).update()` for UI config writes. */
export async function saveOpenRouterApiKey(apiKey: string): Promise<void> {
  const trimmedKey = apiKey.trim();
  const configPath = getOpenClawConfigPath();
  const currentConfig = await loadOpenClawConfig(configPath);
  const nextConfig = applyOpenRouterApiKey(currentConfig, trimmedKey);

  await mkdir(dirname(configPath), { recursive: true });
  await writeFile(configPath, `${JSON.stringify(nextConfig, null, 2)}\n`, "utf8");
}