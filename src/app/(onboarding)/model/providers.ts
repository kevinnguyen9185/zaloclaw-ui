export type ProviderId =
  | "openai"
  | "google"
  | "anthropic"
  | "openrouter"
  | "litellm";

export type ProviderOption = {
  id: ProviderId;
  label: string;
  defaultModelId: string;
};

export const PROVIDER_OPTIONS: readonly ProviderOption[] = [
  { id: "openai", label: "openai", defaultModelId: "gpt-4.1-mini" },
  { id: "google", label: "google", defaultModelId: "gemini-2.5-flash" },
  {
    id: "anthropic",
    label: "anthropic",
    defaultModelId: "claude-3-5-sonnet-latest",
  },
  {
    id: "openrouter",
    label: "openrouter",
    defaultModelId: "openai/gpt-4o-mini",
  },
  {
    id: "litellm",
    label: "litellm",
    defaultModelId: "openclaw-smart-router",
  },
] as const;

export function isProviderId(value: unknown): value is ProviderId {
  return (
    value === "openai" ||
    value === "google" ||
    value === "anthropic" ||
    value === "openrouter" ||
    value === "litellm"
  );
}

export function getProviderOption(providerId: ProviderId): ProviderOption {
  return (
    PROVIDER_OPTIONS.find((provider) => provider.id === providerId) ??
    PROVIDER_OPTIONS[0]
  );
}

export function resolveProviderId(value: unknown): ProviderId {
  return isProviderId(value) ? value : PROVIDER_OPTIONS[0].id;
}

export function fingerprintApiKey(apiKey: string): string {
  const value = apiKey.trim();
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}
