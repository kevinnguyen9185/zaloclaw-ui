"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RecoveryDialog } from "@/components/status/RecoveryDialog";
import { StatusBar } from "@/components/status/StatusBar";
import { StepProgress } from "@/components/onboarding/StepProgress";
import { useLocalization } from "@/lib/i18n/context";
import { useOnboarding } from "@/lib/onboarding/context";
import { useConnectionStatus } from "@/lib/status/context";

export function OnboardingShell({ children }: { children: ReactNode }) {
  const { state } = useOnboarding();
  const { t } = useLocalization();
  const { recoveryService, dismissRecovery, checkNow } = useConnectionStatus();
  const pathname = usePathname();

  // Don't block the Zalo setup page with a Zalo recovery dialog — the user is already there.
  const visibleRecovery = recoveryService === "zalo" && pathname === "/zalo" ? null : recoveryService;

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
          <StatusBar />
          <StepProgress step={state.step} />
          <div>{children}</div>
        </CardContent>
      </Card>
      <RecoveryDialog
        service={visibleRecovery}
        onDismiss={dismissRecovery}
        onRetry={checkNow}
      />
    </div>
  );
}
