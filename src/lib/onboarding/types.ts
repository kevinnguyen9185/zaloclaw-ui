export type OnboardingStep = "check" | "model" | "zalo" | "complete";

export type ZaloState = "unknown" | "connected" | "skipped";

export interface OnboardingState {
  step: OnboardingStep;
  model: string | null;
  zalo: ZaloState;
  completed: boolean;
}

export const INITIAL_ONBOARDING_STATE: OnboardingState = {
  step: "check",
  model: null,
  zalo: "unknown",
  completed: false,
};
