"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  INITIAL_ONBOARDING_STATE,
  type OnboardingState,
  type OnboardingStep,
  type ZaloState,
} from "@/lib/onboarding/types";
import {
  loadOnboardingState,
  saveOnboardingState,
} from "@/lib/onboarding/storage";

type OnboardingContextValue = {
  state: OnboardingState;
  advance: () => void;
  setModel: (model: string | null) => void;
  setZalo: (zalo: ZaloState) => void;
  setStep: (step: OnboardingStep) => void;
  setCompleted: (completed: boolean) => void;
  reset: () => void;
};

const STEP_ORDER: OnboardingStep[] = ["check", "model", "zalo", "complete"];

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

function nextStep(current: OnboardingStep): OnboardingStep {
  const index = STEP_ORDER.indexOf(current);
  if (index < 0 || index >= STEP_ORDER.length - 1) {
    return "complete";
  }

  return STEP_ORDER[index + 1];
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>(INITIAL_ONBOARDING_STATE);

  useEffect(() => {
    setState(loadOnboardingState());
  }, []);

  const persist = useCallback((next: OnboardingState) => {
    saveOnboardingState(next);
    return next;
  }, []);

  const setStep = useCallback(
    (step: OnboardingStep) => {
      setState((prev) => persist({ ...prev, step }));
    },
    [persist]
  );

  const advance = useCallback(() => {
    setState((prev) => {
      const step = nextStep(prev.step);
      const completed = step === "complete" ? prev.completed : prev.completed;
      return persist({ ...prev, step, completed });
    });
  }, [persist]);

  const setModel = useCallback(
    (model: string | null) => {
      setState((prev) => persist({ ...prev, model }));
    },
    [persist]
  );

  const setZalo = useCallback(
    (zalo: ZaloState) => {
      setState((prev) => persist({ ...prev, zalo }));
    },
    [persist]
  );

  const setCompleted = useCallback(
    (completed: boolean) => {
      setState((prev) => persist({ ...prev, completed }));
    },
    [persist]
  );

  const reset = useCallback(() => {
    setState(persist(INITIAL_ONBOARDING_STATE));
  }, [persist]);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      state,
      advance,
      setModel,
      setZalo,
      setStep,
      setCompleted,
      reset,
    }),
    [state, advance, setModel, setZalo, setStep, setCompleted, reset]
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }

  return context;
}
