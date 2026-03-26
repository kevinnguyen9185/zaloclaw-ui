"use client";

import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StepProgress } from "@/components/onboarding/StepProgress";
import { useOnboarding } from "@/lib/onboarding/context";

export function OnboardingShell({ children }: { children: ReactNode }) {
  const { state } = useOnboarding();

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-8">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Zalo Claw Setup</CardTitle>
          <CardDescription>
            Complete the 4-step onboarding to connect your assistant.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <StepProgress step={state.step} />
          <div>{children}</div>
        </CardContent>
      </Card>
    </div>
  );
}
