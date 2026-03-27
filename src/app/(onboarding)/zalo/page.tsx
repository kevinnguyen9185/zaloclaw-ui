"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useGateway } from "@/lib/gateway/context";
import { useLocalization } from "@/lib/i18n/context";
import { useOnboarding } from "@/lib/onboarding/context";

function isZaloConnected(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const data = payload as Record<string, unknown>;

  // channels.status response: payload.channels is a dict keyed by channel id
  if (data.channels && typeof data.channels === "object" && !Array.isArray(data.channels)) {
    const channels = data.channels as Record<string, unknown>;
    const zalo = channels.zalo;
    if (zalo && typeof zalo === "object") {
      const entry = zalo as Record<string, unknown>;
      return entry.running === true;
    }
  }

  // channelAccounts fallback
  if (data.channelAccounts && typeof data.channelAccounts === "object") {
    const accounts = data.channelAccounts as Record<string, unknown>;
    const zaloAccounts = Array.isArray(accounts.zalo) ? accounts.zalo : [];
    return zaloAccounts.some(
      (a) => a && typeof a === "object" && (a as Record<string, unknown>).running === true
    );
  }

  return false;
}

export default function OnboardingZaloPage() {
  const router = useRouter();
  const { status, send } = useGateway();
  const { setZalo, setStep } = useOnboarding();
  const { t } = useLocalization();

  const [checking, setChecking] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    if (status !== "connected") {
      return;
    }

    setChecking(true);
    setError(null);

    try {
      const response = await send("channels.status", {});
      setConnected(isZaloConnected(response));
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : "Failed to fetch channel status";
      setError(message);
    } finally {
      setChecking(false);
    }
  }, [send, status]);

  useEffect(() => {
    if (status !== "connected") {
      return;
    }

    void checkStatus();

    const timer = window.setInterval(() => {
      void checkStatus();
    }, 3000);

    return () => window.clearInterval(timer);
  }, [checkStatus, status]);

  return (
    <section className="space-y-5">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-primary/90">
          {t("onboarding.zalo.eyebrow")}
        </p>
        <h2 className="font-heading text-2xl font-semibold text-foreground sm:text-[1.75rem]">
          {t("onboarding.zalo.title")}
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t("onboarding.zalo.subtitle")}
        </p>
      </header>

      <div className="space-y-2 rounded-xl border bg-card/80 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">{t("onboarding.zalo.status")}</span>
          <Badge variant={connected ? "default" : "outline"}>
            {connected ? t("common.connected") : t("onboarding.zalo.notPaired")}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {checking ? t("onboarding.zalo.checking") : t("onboarding.zalo.autoRefresh")}
        </p>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>

      <Separator />

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={() => void checkStatus()}>
          {t("common.refresh")}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setZalo("skipped");
            setStep("complete");
            router.push("/complete");
          }}
        >
          {t("onboarding.zalo.skip")}
        </Button>

        <Button
          type="button"
          disabled={!connected}
          onClick={() => {
            setZalo("connected");
            setStep("complete");
            router.push("/complete");
          }}
        >
          {t("common.next")}
        </Button>
      </div>
    </section>
  );
}
