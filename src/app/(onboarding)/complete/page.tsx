"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLocalization } from "@/lib/i18n/context";
import { useOnboarding } from "@/lib/onboarding/context";

export default function OnboardingCompletePage() {
  const router = useRouter();
  const { state, setCompleted, setStep } = useOnboarding();
  const { t } = useLocalization();

  // Set the current step when the page loads
  useEffect(() => {
    setStep("complete");
  }, [setStep]);

  return (
    <section className="space-y-5">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-primary/90">
          {t("onboarding.complete.eyebrow")}
        </p>
        <h2 className="font-heading text-2xl font-semibold text-foreground sm:text-[1.75rem]">
          {t("onboarding.complete.title")}
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t("onboarding.complete.subtitle")}
        </p>
      </header>

      <div className="space-y-3 rounded-xl border bg-card/80 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">{t("onboarding.complete.selectedModel")}</span>
          <Badge variant="secondary">{state.model ?? t("onboarding.complete.notSelected")}</Badge>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">{t("onboarding.complete.zalo")}</span>
          <Badge variant={state.zalo === "connected" ? "default" : "outline"}>
            {state.zalo === "connected" ? t("common.connected") : t("onboarding.complete.skipped")}
          </Badge>
        </div>
      </div>

      <Separator />

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={() => {
            setCompleted(true);
            router.push("/dashboard");
          }}
        >
          {t("onboarding.complete.goDashboard")}
        </Button>
      </div>
    </section>
  );
}
