"use client";

import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useOnboarding } from "@/lib/onboarding/context";

export default function OnboardingCompletePage() {
  const router = useRouter();
  const { state, setCompleted } = useOnboarding();

  return (
    <section className="space-y-5">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-primary/90">
          Step 4 · Launch Ready
        </p>
        <h2 className="font-heading text-2xl font-semibold text-foreground sm:text-[1.75rem]">
          You&apos;re ready to enter your dashboard
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Quick review before handoff: your model and Zalo connection status are
          shown below.
        </p>
      </header>

      <div className="space-y-3 rounded-xl border bg-card/80 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">Selected Model</span>
          <Badge variant="secondary">{state.model ?? "Not selected"}</Badge>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">Zalo</span>
          <Badge variant={state.zalo === "connected" ? "default" : "outline"}>
            {state.zalo === "connected" ? "Connected" : "Skipped"}
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
          Go to Dashboard
        </Button>
      </div>
    </section>
  );
}
