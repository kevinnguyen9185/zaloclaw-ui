"use client";

import type { OnboardingStep } from "@/lib/onboarding/types";

const STEPS: Array<{ key: OnboardingStep; label: string }> = [
  { key: "check", label: "Gateway" },
  { key: "model", label: "Model" },
  { key: "zalo", label: "Zalo" },
  { key: "complete", label: "Done" },
];

function getStepIndex(step: OnboardingStep): number {
  const index = STEPS.findIndex((item) => item.key === step);
  return index < 0 ? 0 : index;
}

export function StepProgress({ step }: { step: OnboardingStep }) {
  const index = getStepIndex(step);

  return (
    <ol className="flex items-center gap-0">
      {STEPS.map((item, i) => {
        const isActive = item.key === step;
        const isDone = i < index;
        const isLast = i === STEPS.length - 1;

        return (
          <li key={item.key} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={[
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  isDone
                    ? "bg-primary text-primary-foreground"
                    : isActive
                      ? "border-2 border-primary bg-primary/10 text-primary"
                      : "border border-border bg-muted text-muted-foreground",
                ].join(" ")}
                aria-current={isActive ? "step" : undefined}
              >
                {isDone ? "✓" : i + 1}
              </div>
              <span
                className={[
                  "text-xs",
                  isActive ? "font-medium text-foreground" : "text-muted-foreground",
                ].join(" ")}
              >
                {item.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={[
                  "mx-1 mb-4 h-px flex-1",
                  isDone ? "bg-primary" : "bg-border",
                ].join(" ")}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
