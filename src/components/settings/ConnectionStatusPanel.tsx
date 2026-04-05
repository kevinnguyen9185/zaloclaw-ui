"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLocalization } from "@/lib/i18n/context";
import { useConnectionStatus } from "@/lib/status/context";
import type { ServiceStatus } from "@/lib/status/types";

function formatTimestamp(ts: number | null): string {
  if (!ts) {
    return "—";
  }

  return new Date(ts).toLocaleTimeString();
}

function ServiceRow({ name, status }: { name: string; status: ServiceStatus }) {
  const stateColor =
    status.state === "connected"
      ? "bg-emerald-500"
      : status.state === "disconnected"
        ? "bg-rose-500"
        : status.state === "checking"
          ? "bg-amber-400"
          : "bg-muted-foreground/40";

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex items-center gap-2">
        <span
          className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${stateColor}`}
          aria-hidden="true"
        />
        <span className="text-sm font-medium">{name}</span>
      </div>
      <div className="text-right">
        <span className="text-xs text-muted-foreground capitalize">{status.state}</span>
        {status.lastCheckedAt ? (
          <span className="ml-2 text-xs text-muted-foreground">
            {formatTimestamp(status.lastCheckedAt)}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function ConnectionStatusPanel() {
  const { t } = useLocalization();
  const { snapshot, checkNow } = useConnectionStatus();
  const [checking, setChecking] = useState(false);

  const handleTestConnection = async () => {
    setChecking(true);
    try {
      await checkNow();
    } finally {
      setChecking(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t("settings.connectionStatus.title")}</CardTitle>
        <CardDescription>{t("settings.connectionStatus.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        <ServiceRow name={t("common.openclaw")} status={snapshot.openclaw} />
        <ServiceRow name={t("common.zalo")} status={snapshot.zalo} />
        {snapshot.lastCheckAt ? (
          <p className="pt-1 text-xs text-muted-foreground">
            {t("settings.connectionStatus.lastChecked")}: {formatTimestamp(snapshot.lastCheckAt)}
          </p>
        ) : null}
        <div className="pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={checking || snapshot.isChecking}
            onClick={() => void handleTestConnection()}
          >
            {checking || snapshot.isChecking
              ? t("common.checking")
              : t("settings.connectionStatus.testButton")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
