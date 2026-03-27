"use client";

import { Badge } from "@/components/ui/badge";
import { useGateway } from "@/lib/gateway/context";

export function GatewayStatusBadge() {
  const { status } = useGateway();

  if (status === "connected") {
    return (
      <Badge className="gap-1.5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-status-fade" />
        Gateway
      </Badge>
    );
  }

  if (status === "connecting" || status === "authenticating") {
    return (
      <Badge variant="secondary" className="gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Connecting
      </Badge>
    );
  }

  if (status === "error") {
    return (
      <Badge variant="destructive" className="gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
        Disconnected
      </Badge>
    );
  }

  return <Badge variant="outline">Gateway</Badge>;
}
