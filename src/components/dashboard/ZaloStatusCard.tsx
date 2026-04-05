"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { useLocalization } from "@/lib/i18n/context";
import { loadOnboardingState } from "@/lib/onboarding/storage";
import { useConnectionStatus } from "@/lib/status/context";

export function ZaloStatusCard() {
  const { t } = useLocalization();
  const [skipped, setSkipped] = useState(false);
  const { snapshot } = useConnectionStatus();

  useEffect(() => {
    const state = loadOnboardingState();
    setSkipped(state.zalo === "skipped");
  }, []);

  const zaloStatus = snapshot.zalo;
  const connected = zaloStatus.state === "connected";
  const isDisconnected = zaloStatus.state === "disconnected";

  return (
    <Card className="animate-card-enter-2">
      <CardContent className="flex items-center justify-between gap-3 py-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {t("dashboard.zalo.label")}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold leading-tight">
            <span
              className={[
                "inline-block h-2 w-2 shrink-0 rounded-full",
                connected
                  ? "bg-emerald-500"
                  : isDisconnected
                    ? "bg-rose-500"
                    : "bg-muted-foreground/40",
              ].join(" ")}
              aria-hidden="true"
            />
            {connected ? t("common.connected") : t("dashboard.zalo.notPaired")}
          </p>
          {zaloStatus.error ? (
            <p className="mt-1 text-xs text-destructive">{zaloStatus.error}</p>
          ) : null}
        </div>
        {!connected && skipped && (
          <Link
            href="/zalo"
            className={buttonVariants({ size: "sm", variant: "outline" })}
          >
            {t("dashboard.zalo.connectAction")}
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
