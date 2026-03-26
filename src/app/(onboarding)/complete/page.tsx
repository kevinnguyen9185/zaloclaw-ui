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
    <section className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">Step 4: Complete</h2>
        <p className="text-sm text-muted-foreground">
          Review your setup and continue to the dashboard.
        </p>
      </header>

      <div className="space-y-3 rounded-lg border p-4">
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
