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
    <Card>
      <CardHeader>
        <CardTitle>Zalo Status</CardTitle>
        <CardDescription>Channel pairing for assistant delivery.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {connected ? (
          <Badge>Connected</Badge>
        ) : (
          <div className="flex items-center gap-3">
            <Badge variant="outline">Not connected</Badge>
            {skipped ? (
              <Link href="/zalo" className={buttonVariants({ size: "sm", variant: "outline" })}>
                Connect Zalo
              </Link>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
