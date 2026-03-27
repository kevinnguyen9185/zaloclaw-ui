"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DEVICE_ID_STORAGE_KEY,
  DEVICE_PRIVATE_KEY_STORAGE_KEY,
  DEVICE_PUBLIC_KEY_STORAGE_KEY,
  DEVICE_TOKEN_STORAGE_KEY,
  TOKEN_STORAGE_KEY,
} from "@/lib/gateway/client";
import { useGateway } from "@/lib/gateway/context";
import { useOnboarding } from "@/lib/onboarding/context";

type ControlUiConfig = {
  assistantName?: string;
  serverVersion?: string;
};

export default function OnboardingCheckPage() {
  const router = useRouter();
  const { status, error } = useGateway();
  const { setStep } = useOnboarding();

  const [config, setConfig] = useState<ControlUiConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [deviceToken, setDeviceToken] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const configUrl = useMemo(() => "/api/gateway/config", []);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setFetchError(null);

    try {
      const response = await fetch(configUrl);
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(
          data?.error ?? `Config request failed (${response.status})`
        );
      }

      const data = (await response.json()) as ControlUiConfig;
      setConfig(data);
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : "Unable to reach gateway config endpoint";
      setFetchError(message);
      setConfig(null);
    } finally {
      setLoading(false);
    }
  }, [configUrl]);

  useEffect(() => {
    void fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.localStorage.getItem(TOKEN_STORAGE_KEY) ?? "";
    setToken(stored);
    setDeviceId(window.localStorage.getItem(DEVICE_ID_STORAGE_KEY) ?? "");
    setPublicKey(
      window.localStorage.getItem(DEVICE_PUBLIC_KEY_STORAGE_KEY) ?? ""
    );
    setPrivateKey(
      window.localStorage.getItem(DEVICE_PRIVATE_KEY_STORAGE_KEY) ?? ""
    );
    setDeviceToken(
      window.localStorage.getItem(DEVICE_TOKEN_STORAGE_KEY) ?? ""
    );
  }, []);

  const canContinue = status === "connected";
  const needsToken = !token || error?.includes("1008") === true;

  return (
    <section className="space-y-5">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-primary/90">
          Step 1 · Gateway Ready
        </p>
        <h2 className="font-heading text-2xl font-semibold text-foreground sm:text-[1.75rem]">
          Let&apos;s make sure your assistant can reach OpenClaw
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          We will verify config access, real-time connection, and authentication so
          the next setup steps are smooth.
        </p>
      </header>

      <div className="space-y-2 rounded-xl border bg-card/80 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">Gateway Config</span>
          <Badge variant={fetchError ? "destructive" : "secondary"}>
            {loading ? "Loading" : fetchError ? "Unavailable" : "Loaded"}
          </Badge>
        </div>

        <p className="text-sm">
          Assistant: <strong>{config?.assistantName ?? "Unknown"}</strong>
        </p>
        <p className="text-sm">
          Version: <strong>{config?.serverVersion ?? "Unknown"}</strong>
        </p>
        {fetchError ? (
          <p className="text-sm text-destructive">{fetchError}</p>
        ) : null}
      </div>

      <div className="space-y-2 rounded-xl border bg-card/80 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">WebSocket Status</span>
          <Badge variant={canContinue ? "default" : "outline"}>{status}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {error ?? "Connection is being managed by GatewayProvider."}
        </p>
      </div>

      <div className="space-y-3 rounded-xl border bg-card/80 p-4">
        <div className="space-y-1">
          <h3 className="font-heading text-base font-semibold">Gateway Token</h3>
          <p className="text-sm text-muted-foreground">
            {needsToken
              ? "Authentication is required. Enter your OpenClaw token and reconnect. Device credentials are generated automatically."
              : "Great, token already exists for this session. Device credentials remain managed automatically."}
          </p>
        </div>

        <input
          type="password"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="Paste gateway token"
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        />

        <Button
          type="button"
          variant="ghost"
          onClick={() => setShowAdvanced((value) => !value)}
        >
          {showAdvanced ? "Hide advanced device settings" : "Show advanced device settings"}
        </Button>

        {showAdvanced ? (
          <div className="space-y-2">
            <input
              value={deviceId}
              onChange={(event) => setDeviceId(event.target.value)}
              placeholder="Device ID (optional override)"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            />
            <input
              value={publicKey}
              onChange={(event) => setPublicKey(event.target.value)}
              placeholder="Device public key (optional override)"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            />
            <input
              type="password"
              value={privateKey}
              onChange={(event) => setPrivateKey(event.target.value)}
              placeholder="Device private key (optional override)"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            />
            <input
              value={deviceToken}
              onChange={(event) => setDeviceToken(event.target.value)}
              placeholder="Device token (optional)"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            />
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (typeof window === "undefined") {
                return;
              }

              if (!token.trim()) {
                return;
              }

              window.localStorage.setItem(TOKEN_STORAGE_KEY, token.trim());
              if (deviceId.trim()) {
                window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId.trim());
              }
              if (publicKey.trim()) {
                window.localStorage.setItem(
                  DEVICE_PUBLIC_KEY_STORAGE_KEY,
                  publicKey.trim()
                );
              }
              if (privateKey.trim()) {
                window.localStorage.setItem(
                  DEVICE_PRIVATE_KEY_STORAGE_KEY,
                  privateKey.trim()
                );
              }
              if (deviceToken.trim()) {
                window.localStorage.setItem(
                  DEVICE_TOKEN_STORAGE_KEY,
                  deviceToken.trim()
                );
              }
              window.location.reload();
            }}
          >
            Save Token and Reconnect
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              if (typeof window === "undefined") {
                return;
              }

              window.localStorage.removeItem(TOKEN_STORAGE_KEY);
              window.localStorage.removeItem(DEVICE_ID_STORAGE_KEY);
              window.localStorage.removeItem(DEVICE_PUBLIC_KEY_STORAGE_KEY);
              window.localStorage.removeItem(DEVICE_PRIVATE_KEY_STORAGE_KEY);
              window.localStorage.removeItem(DEVICE_TOKEN_STORAGE_KEY);
              setToken("");
              setDeviceId("");
              setPublicKey("");
              setPrivateKey("");
              setDeviceToken("");
              window.location.reload();
            }}
          >
            Clear Token
          </Button>
        </div>
      </div>

      <Separator />

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={() => void fetchConfig()}>
          Retry
        </Button>
        <Button
          type="button"
          disabled={!canContinue}
          onClick={() => {
            setStep("model");
            router.push("/model");
          }}
        >
          Next
        </Button>
      </div>
    </section>
  );
}
