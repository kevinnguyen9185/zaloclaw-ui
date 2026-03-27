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
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { useGateway } from "@/lib/gateway/context";
import { loadOnboardingState } from "@/lib/onboarding/storage";

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

export function ZaloStatusCard() {
  const { status, send } = useGateway();
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
        const response = await send("channels.status", {});
        if (cancelled) {
          return;
        }

        setConnected(isZaloConnected(response));
      } catch (caught) {
        if (cancelled) {
          return;
        }

        const message =
          caught instanceof Error
            ? caught.message
            : "Failed to load Zalo status";
        setError(message);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [send, status]);

  return (
    <Card className="animate-card-enter-2">
      <CardHeader className="pb-2">
        <CardDescription className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Zalo Channel
        </CardDescription>
        <CardTitle className="flex items-center gap-2 text-xl">
          <span
            className={[
              "inline-block h-2 w-2 rounded-full",
              connected ? "bg-emerald-500" : "bg-muted-foreground/40",
            ].join(" ")}
            aria-hidden="true"
          />
          {connected ? "Connected" : "Not connected"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {!connected && skipped && (
          <Link
            href="/zalo"
            className={buttonVariants({ size: "sm", variant: "outline" })}
          >
            Connect Zalo
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
