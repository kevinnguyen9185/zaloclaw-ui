import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ONBOARDING_STORAGE_KEY,
  loadOnboardingState,
  saveOnboardingState,
} from "@/lib/onboarding/storage";
import { INITIAL_ONBOARDING_STATE, type OnboardingState } from "@/lib/onboarding/types";

describe("onboarding storage", () => {
  beforeEach(() => {
    const backing = new Map<string, string>();

    const localStorageMock = {
      getItem: (key: string) => backing.get(key) ?? null,
      setItem: (key: string, value: string) => {
        backing.set(key, value);
      },
      removeItem: (key: string) => {
        backing.delete(key);
      },
      clear: () => {
        backing.clear();
      },
    };

    vi.stubGlobal("window", {
      localStorage: localStorageMock,
    });
  });

  it("resumes at saved step after refresh", () => {
    const saved: OnboardingState = {
      step: "model",
      model: "gpt-4.1",
      zalo: "unknown",
      completed: false,
    };

    saveOnboardingState(saved);

    const loaded = loadOnboardingState();
    expect(loaded.step).toBe("model");
    expect(loaded.model).toBe("gpt-4.1");
  });

  it("falls back to initial state when storage is corrupted", () => {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "not-json");

    const loaded = loadOnboardingState();
    expect(loaded).toEqual(INITIAL_ONBOARDING_STATE);
  });

  it("falls back to initial state on schema mismatch", () => {
    window.localStorage.setItem(
      ONBOARDING_STORAGE_KEY,
      JSON.stringify({ step: "bad-step", model: 123 })
    );

    const loaded = loadOnboardingState();
    expect(loaded).toEqual(INITIAL_ONBOARDING_STATE);
  });
});
