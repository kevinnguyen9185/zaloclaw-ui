"use client";

import { Badge } from "@/components/ui/badge";
import { useGateway } from "@/lib/gateway/context";

export function GatewayStatusBadge() {
  const { status } = useGateway();

  if (status === "connected") {
    return <Badge>Connected</Badge>;
  }

  if (status === "connecting" || status === "authenticating") {
    return <Badge variant="secondary">Reconnecting...</Badge>;
  }

  if (status === "error") {
    return <Badge variant="destructive">Disconnected</Badge>;
  }

  return <Badge variant="outline">Idle</Badge>;
}
