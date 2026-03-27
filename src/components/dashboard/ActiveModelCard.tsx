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
  const [model, setModel] = useState<ModelInfo | null>(null);
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
    <Card className="animate-card-enter-1">
      <CardHeader className="pb-2">
        <CardDescription className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {t("dashboard.activeModel.label")}
        </CardDescription>
        <CardTitle className="text-xl">
          {error ? (
            <span className="text-destructive text-base font-normal">{error}</span>
          ) : model ? (
            model.name
          ) : (
            <span className="text-muted-foreground text-base font-normal">{t("dashboard.activeModel.empty")}</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {model && !error && (
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {model.provider}
          </span>
        )}
      </CardContent>
    </Card>
  );
}
