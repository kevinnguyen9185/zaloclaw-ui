import type { ReactNode } from "react";

import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { OnboardingProvider } from "@/lib/onboarding/context";

export default function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <OnboardingProvider>
      <OnboardingShell>{children}</OnboardingShell>
    </OnboardingProvider>
  );
}
