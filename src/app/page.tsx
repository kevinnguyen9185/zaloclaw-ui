"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { loadOnboardingState } from "@/lib/onboarding/storage";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const state = loadOnboardingState();
    if (state.completed) {
      router.replace("/dashboard");
      return;
    }

    router.replace("/check");
  }, [router]);

  return (
    <div className="p-6 text-sm text-muted-foreground" aria-live="polite">
      Redirecting...
    </div>
  );
}
