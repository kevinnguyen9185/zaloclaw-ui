"use client";

import { Badge } from "@/components/ui/badge";
import type { ServiceName, ServiceStatus } from "@/lib/status/types";
import { useLocalization } from "@/lib/i18n/context";

type StatusIndicatorProps = {
  service: ServiceName;
  status: ServiceStatus;
};

export function StatusIndicator({ service, status }: StatusIndicatorProps) {
  const { t } = useLocalization();

  const labelKey = service === "openclaw" ? "common.openclaw" : "common.zalo";
  const statusKey =
    status.state === "connected"
      ? "common.connected"
      : status.state === "checking"
        ? "common.checking"
        : status.state === "disconnected"
          ? "common.disconnected"
          : "common.unknown";

  const dotClass =
    status.state === "connected"
      ? "bg-emerald-500"
      : status.state === "checking"
        ? "bg-amber-500"
        : status.state === "disconnected"
          ? "bg-rose-500"
          : "bg-muted-foreground/50";

  const variant = status.state === "disconnected" ? "destructive" : "outline";

  const title = status.lastCheckedAt
    ? `${t(labelKey)} · ${new Date(status.lastCheckedAt).toLocaleTimeString()}`
    : t(labelKey);

  return (
    <Badge variant={variant} className="gap-1.5" title={title}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} aria-hidden="true" />
      <span className="text-xs">
        {t(labelKey)}: {t(statusKey)}
      </span>
    </Badge>
  );
}
