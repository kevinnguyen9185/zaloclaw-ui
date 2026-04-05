"use client";

import { useEffect, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { createGatewayConfigService } from "@/lib/gateway/config";
import { useGateway } from "@/lib/gateway/context";
import { useLocalization } from "@/lib/i18n/context";
import { useConnectionStatus } from "@/lib/status/context";

type ModelInfo = {
  name: string;
  provider: string;
};

function extractModel(reference: string | null): ModelInfo | null {
  if (!reference) {
    return null;
  }

  const normalized = reference.trim();
  if (!normalized) {
    return null;
  }

  const separator = normalized.indexOf("/");
  const provider = separator > 0 ? normalized.slice(0, separator) : "unknown";
  const name = separator > 0 ? normalized.slice(separator + 1) : normalized;

  return { name, provider };
}

export function ActiveModelCard() {
  const { status, send } = useGateway();
  const { t } = useLocalization();
  const { snapshot } = useConnectionStatus();
  const [model, setModel] = useState<ModelInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openclawDisconnected = snapshot.openclaw.state === "disconnected";
  useEffect(() => {
    if (status !== "connected") {
      return;
    }

    let cancelled = false;

    const load = async () => {
      setError(null);
      try {
        const service = createGatewayConfigService(send);
        const config = await service.load();
        if (cancelled) {
          return;
        }

        setModel(extractModel(config.normalized.agents.defaults.model.primary));
      } catch (caught) {
        if (cancelled) {
          return;
        }

        const message =
          caught instanceof Error ? caught.message : t("dashboard.activeModel.error");
        setError(message);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [send, status, t]);

  return (
    <Card className={["animate-card-enter-1", openclawDisconnected ? "opacity-60" : ""].join(" ").trim()}>
      <CardContent className="flex items-center justify-between gap-3 py-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {t("dashboard.activeModel.label")}
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold leading-tight">
            {openclawDisconnected ? (
              <span className="text-muted-foreground font-normal" title={t("common.disconnected")}>{t("dashboard.activeModel.unavailable")}</span>
            ) : error ? (
              <span className="text-destructive font-normal">{error}</span>
            ) : model ? (
              model.name
            ) : (
              <span className="text-muted-foreground font-normal">{t("dashboard.activeModel.empty")}</span>
            )}
          </p>
        </div>
        {model && !error && !openclawDisconnected && (
          <span className="shrink-0 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            {model.provider}
          </span>
        )}
      </CardContent>
    </Card>
  );
}
