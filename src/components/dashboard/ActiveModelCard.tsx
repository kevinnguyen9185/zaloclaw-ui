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
          caught instanceof Error ? caught.message : "Failed to read active model";
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
        <CardTitle>Active Model</CardTitle>
        <CardDescription>Current assistant runtime model.</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {model ? `${model.name} (${model.provider})` : "No model available"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
