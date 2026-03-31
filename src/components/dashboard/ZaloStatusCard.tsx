"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { useGateway } from "@/lib/gateway/context";
import { isZaloConnectedFromChannelsStatus } from "@/lib/gateway/zalo-status";
import { useLocalization } from "@/lib/i18n/context";
import { loadOnboardingState } from "@/lib/onboarding/storage";

export function ZaloStatusCard() {
  const { status, send } = useGateway();
  const { t } = useLocalization();
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    const state = loadOnboardingState();
    setSkipped(state.zalo === "skipped");
  }, []);

  useEffect(() => {
    if (status !== "connected") {
      return;
    }

    let cancelled = false;

    const load = async () => {
      setError(null);
      try {
        const response = await send("channels.status", { probe: true });
        if (cancelled) {
          return;
        }

        setConnected(isZaloConnectedFromChannelsStatus(response));
      } catch (caught) {
        if (cancelled) {
          return;
        }

        const message =
          caught instanceof Error
            ? caught.message
            : t("dashboard.zalo.error");
        setError(message);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [send, status, t]);

  return (
    <Card className="animate-card-enter-2">
      <CardHeader className="pb-2">
        <CardDescription className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {t("dashboard.zalo.label")}
        </CardDescription>
        <CardTitle className="flex items-center gap-2 text-xl">
          <span
            className={[
              "inline-block h-2 w-2 rounded-full",
              connected ? "bg-emerald-500" : "bg-muted-foreground/40",
            ].join(" ")}
            aria-hidden="true"
          />
          {connected ? t("common.connected") : t("dashboard.zalo.notPaired")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
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
