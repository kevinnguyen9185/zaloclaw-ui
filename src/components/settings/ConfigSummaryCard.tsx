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
import { useLocalization } from "@/lib/i18n/context";

type ConfigSummary = {
  model: string | null;
  gatewayMode: string;
  gatewayBind: string;
};

export function ConfigSummaryCard() {
  const { status, send } = useGateway();
  const { t } = useLocalization();
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
            : t("settings.config.error");
        setError(message);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [send, status, t]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.config.title")}</CardTitle>
        <CardDescription>
          {t("settings.config.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1 text-sm text-muted-foreground">
        {error ? <p className="text-destructive">{error}</p> : null}
        {!error ? (
          <>
            <p>{t("settings.config.primaryModel")}: {summary?.model ?? t("settings.config.notSet")}</p>
            <p>{t("settings.config.gatewayMode")}: {summary?.gatewayMode ?? t("settings.config.unknown")}</p>
            <p>{t("settings.config.gatewayBind")}: {summary?.gatewayBind ?? t("settings.config.unknown")}</p>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
