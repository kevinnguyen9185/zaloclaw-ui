"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useOnboarding } from "@/lib/onboarding/context";
import type { OnboardingStep } from "@/lib/onboarding/types";

const STEP_TO_ROUTE: Record<OnboardingStep, string> = {
  check: "/check",
  model: "/model",
  zalo: "/zalo",
  complete: "/complete",
};

export default function OnboardingIndexPage() {
  const router = useRouter();
  const { state } = useOnboarding();

  useEffect(() => {
    router.replace(STEP_TO_ROUTE[state.step]);
  }, [router, state.step]);

  return (
    <div className="text-sm text-muted-foreground" aria-live="polite">
      Redirecting to the current setup step...
    </div>
  );
}
