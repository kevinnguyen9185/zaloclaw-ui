"use client";

import Image from "next/image";
import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StepProgress } from "@/components/onboarding/StepProgress";
import { useLocalization } from "@/lib/i18n/context";
import { useOnboarding } from "@/lib/onboarding/context";

export function OnboardingShell({ children }: { children: ReactNode }) {
  const { state } = useOnboarding();
  const { t } = useLocalization();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0e1a] px-4 py-12">
      {/* Ambient brand background */}
      <div className="pointer-events-none absolute inset-0">
        <Image
          src="/zaloclaw-design.png"
          alt=""
          fill
          className="object-cover object-center opacity-15"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a]/60 via-transparent to-[#0a0e1a]/90" />
      </div>

      <Card className="relative z-10 w-full max-w-2xl animate-hero-enter shadow-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">{t("onboarding.shell.title")}</CardTitle>
          <CardDescription>
            {t("onboarding.shell.subtitle")}
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
