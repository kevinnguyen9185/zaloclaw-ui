export const OPENROUTER_SIGNUP_URL = "https://openrouter.ai/";
export const OPENROUTER_KEY_SAVED_MESSAGE =
  "OpenRouter key saved to openclaw.json.";

export function validateOpenRouterApiKey(apiKey: string): string | null {
  if (!apiKey.trim()) {
    return "Enter your OpenRouter API key.";
  }

  return null;
}

export function redactOpenRouterApiKey(apiKey: string): string {
  const trimmed = apiKey.trim();

  if (!trimmed) {
    return "";
  }

  if (trimmed.length <= 10) {
    return "••••";
  }

  return `${trimmed.slice(0, 6)}...${trimmed.slice(-4)}`;
}

export function sanitizeOpenRouterMessage(
  message: string,
  apiKey: string
): string {
  const trimmed = apiKey.trim();

  if (!trimmed) {
    return message;
  }

  return message.split(trimmed).join(redactOpenRouterApiKey(trimmed));
}