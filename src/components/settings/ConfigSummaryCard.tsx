"use client";

import { useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createGatewayConfigService } from "@/lib/gateway/config";
import { useGateway } from "@/lib/gateway/context";

type ConfigSummary = {
  model: string | null;
  gatewayMode: string;
  gatewayBind: string;
};

export function ConfigSummaryCard() {
  const { status, send } = useGateway();
  const [summary, setSummary] = useState<ConfigSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "connected") {
      return;
    }

    let cancelled = false;

    const load = async () => {
      setError(null);
      try {
        const service = createGatewayConfigService(send);
        const snapshot = await service.load();

        if (cancelled) {
          return;
        }

        setSummary({
          model: snapshot.normalized.agents.defaults.model.primary,
          gatewayMode: snapshot.normalized.gateway.mode,
          gatewayBind: snapshot.normalized.gateway.bind,
        });
      } catch (caught) {
        if (cancelled) {
          return;
        }

        const message =
          caught instanceof Error
            ? caught.message
            : "Failed to load gateway configuration summary";
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
        <CardTitle>Gateway Configuration</CardTitle>
        <CardDescription>
          Structured config values loaded from config.get.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1 text-sm text-muted-foreground">
        {error ? <p className="text-destructive">{error}</p> : null}
        {!error ? (
          <>
            <p>Primary model: {summary?.model ?? "Not set"}</p>
            <p>Gateway mode: {summary?.gatewayMode ?? "Unknown"}</p>
            <p>Gateway bind: {summary?.gatewayBind ?? "Unknown"}</p>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
