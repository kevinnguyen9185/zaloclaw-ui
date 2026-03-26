import {
  INITIAL_ONBOARDING_STATE,
  type OnboardingState,
  type OnboardingStep,
  type ZaloState,
} from "@/lib/onboarding/types";

export const ONBOARDING_STORAGE_KEY = "zaloclaw.onboarding.v1";

const VALID_STEPS: OnboardingStep[] = ["check", "model", "zalo", "complete"];
const VALID_ZALO_STATES: ZaloState[] = ["unknown", "connected", "skipped"];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidStep(value: unknown): value is OnboardingStep {
  return typeof value === "string" && VALID_STEPS.includes(value as OnboardingStep);
}

function isValidZaloState(value: unknown): value is ZaloState {
  return (
    typeof value === "string" &&
    VALID_ZALO_STATES.includes(value as ZaloState)
  );
}

function isOnboardingState(value: unknown): value is OnboardingState {
  if (!isObject(value)) {
    return false;
  }

  return (
    isValidStep(value.step) &&
    (typeof value.model === "string" || value.model === null) &&
    isValidZaloState(value.zalo) &&
    typeof value.completed === "boolean"
  );
}

export function loadOnboardingState(): OnboardingState {
  if (typeof window === "undefined") {
    return INITIAL_ONBOARDING_STATE;
  }

  try {
    const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) {
      return INITIAL_ONBOARDING_STATE;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isOnboardingState(parsed)) {
      return INITIAL_ONBOARDING_STATE;
    }

    return parsed;
  } catch {
    return INITIAL_ONBOARDING_STATE;
  }
}

export function saveOnboardingState(state: OnboardingState): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors and keep app usable.
  }
}
