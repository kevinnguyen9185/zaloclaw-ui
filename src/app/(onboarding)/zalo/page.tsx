"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useGateway } from "@/lib/gateway/context";
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
    <section className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">Step 3: Pair Zalo</h2>
        <p className="text-sm text-muted-foreground">
          Connect your Zalo channel now, or skip and continue setup.
        </p>
      </header>

      <div className="space-y-2 rounded-lg border p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">Zalo Status</span>
          <Badge variant={connected ? "default" : "outline"}>
            {connected ? "Connected" : "Not Paired"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {checking ? "Checking status..." : "Status refreshes every 3 seconds."}
        </p>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>

      <Separator />

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={() => void checkStatus()}>
          Refresh
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
          Skip for now
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
          Next
        </Button>
      </div>
    </section>
  );
}
