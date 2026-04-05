import {
  EMPTY_ASSISTANT_IDENTITY_PROFILE,
  type AssistantIdentityDocuments,
  type AssistantIdentityProfile,
  type AssistantIdentityState,
} from "@/lib/dashboard/assistant-identity";

export const ASSISTANT_IDENTITY_STORAGE_KEY = "zaloclaw.dashboard.assistant-identity.v1";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isAssistantIdentityProfile(value: unknown): value is AssistantIdentityProfile {
  if (!isObject(value)) {
    return false;
  }

  return (
    isString(value.assistantName) &&
    isString(value.creatureType) &&
    isString(value.vibe) &&
    isString(value.emoji) &&
    isString(value.userName) &&
    isString(value.timezone)
  );
}

function isAssistantIdentityDocuments(value: unknown): value is AssistantIdentityDocuments {
  if (value === null) {
    return true;
  }

  if (!isObject(value)) {
    return false;
  }

  return isString(value.agent) && isString(value.soul) && isString(value.user);
}

function isAssistantIdentityState(value: unknown): value is AssistantIdentityState {
  if (!isObject(value)) {
    return false;
  }

  return (
    isAssistantIdentityProfile(value.profile) &&
    isAssistantIdentityDocuments(value.documents ?? null)
  );
}

export function loadAssistantIdentityState(): AssistantIdentityState {
  if (typeof window === "undefined") {
    return { profile: EMPTY_ASSISTANT_IDENTITY_PROFILE, documents: null };
  }

  try {
    const raw = window.localStorage.getItem(ASSISTANT_IDENTITY_STORAGE_KEY);
    if (!raw) {
      return { profile: EMPTY_ASSISTANT_IDENTITY_PROFILE, documents: null };
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isAssistantIdentityState(parsed)) {
      return { profile: EMPTY_ASSISTANT_IDENTITY_PROFILE, documents: null };
    }

    return parsed;
  } catch {
    return { profile: EMPTY_ASSISTANT_IDENTITY_PROFILE, documents: null };
  }
}

export function saveAssistantIdentityState(state: AssistantIdentityState): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(ASSISTANT_IDENTITY_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors and keep dashboard usable.
  }
}