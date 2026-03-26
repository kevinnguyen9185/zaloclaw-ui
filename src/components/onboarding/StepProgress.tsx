"use client";

import { Badge } from "@/components/ui/badge";
import {
  Progress,
  ProgressLabel,
} from "@/components/ui/progress";
import type { OnboardingStep } from "@/lib/onboarding/types";

const STEPS: Array<{ key: OnboardingStep; label: string }> = [
  { key: "check", label: "Gateway" },
  { key: "model", label: "Model" },
  { key: "zalo", label: "Zalo" },
  { key: "complete", label: "Complete" },
];

function getStepIndex(step: OnboardingStep): number {
  const index = STEPS.findIndex((item) => item.key === step);
  return index < 0 ? 0 : index;
}

export function StepProgress({ step }: { step: OnboardingStep }) {
  const index = getStepIndex(step);
  const current = index + 1;
  const value = Math.round((current / STEPS.length) * 100);

  return (
    <div className="space-y-4">
      <Progress value={value}>
        <ProgressLabel>Setup Progress</ProgressLabel>
        <span className="ml-auto text-sm text-muted-foreground tabular-nums">
          {current}/{STEPS.length}
        </span>
      </Progress>

      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STEPS.map((item, itemIndex) => {
          const isActive = item.key === step;
          const isDone = itemIndex < index;

          return (
            <li key={item.key}>
              <Badge variant={isActive || isDone ? "default" : "outline"}>
                {itemIndex + 1}. {item.label}
              </Badge>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
