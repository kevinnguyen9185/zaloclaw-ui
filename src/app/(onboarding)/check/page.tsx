"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";

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
import { useLocalization } from "@/lib/i18n/context";
import { useOnboarding } from "@/lib/onboarding/context";
import { OPENCLAW_GATEWAY_TOKEN } from "@/lib/env";

type ControlUiConfig = {
  assistantName?: string;
  serverVersion?: string;
};

export default function OnboardingCheckPage() {
  const router = useRouter();
  const { status, error } = useGateway();
  const { setStep } = useOnboarding();
  const { t } = useLocalization();

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

  // Set the current step when the page loads
  useEffect(() => {
    setStep("check");
  }, [setStep]);

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
    setToken(OPENCLAW_GATEWAY_TOKEN || stored);
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
          {t("onboarding.check.eyebrow")}
        </p>
        <h2 className="font-heading text-2xl font-semibold text-foreground sm:text-[1.75rem]">
          {t("onboarding.check.title")}
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t("onboarding.check.subtitle")}
        </p>
      </header>

      <div className="space-y-2 rounded-xl border bg-card/80 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">{t("onboarding.check.gatewayConfig")}</span>
          <Badge variant={fetchError ? "destructive" : "secondary"}>
            {loading
              ? t("onboarding.check.loading")
              : fetchError
                ? t("onboarding.check.unavailable")
                : t("onboarding.check.loaded")}
          </Badge>
        </div>

        <p className="text-sm">
          {t("onboarding.check.assistant")}: <strong>{config?.assistantName ?? t("settings.config.unknown")}</strong>
        </p>
        <p className="text-sm">
          {t("onboarding.check.version")}: <strong>{config?.serverVersion ?? t("settings.config.unknown")}</strong>
        </p>
        {fetchError ? (
          <p className="text-sm text-destructive">{fetchError}</p>
        ) : null}
      </div>

      <div className="space-y-2 rounded-xl border bg-card/80 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">{t("onboarding.check.wsStatus")}</span>
          <Badge variant={canContinue ? "default" : "outline"}>{status}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {error ?? t("onboarding.check.wsManaged")}
        </p>
      </div>

      <div className="space-y-3 rounded-xl border bg-card/80 p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-base font-semibold">{t("onboarding.check.tokenTitle")}</h3>
            <button
              type="button"
              className="group relative inline-flex"
              title={t("onboarding.check.tokenEnvHint")}
              aria-label={t("onboarding.check.tokenEnvHint")}
            >
              <Info className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-foreground" />
              <div className="invisible absolute bottom-full left-1/2 z-10 mb-2 w-64 -translate-x-1/2 rounded-md bg-popover px-2 py-1 text-center text-xs text-popover-foreground shadow-md group-hover:visible">
                {t("onboarding.check.tokenEnvHint")}
              </div>
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            {needsToken
              ? t("onboarding.check.tokenNeeded")
              : t("onboarding.check.tokenExists")}
          </p>
        </div>

        <input
          type="password"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder={t("onboarding.check.tokenPlaceholder")}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        />

        <Button
          type="button"
          variant="ghost"
          onClick={() => setShowAdvanced((value) => !value)}
        >
          {showAdvanced ? t("onboarding.check.hideAdvanced") : t("onboarding.check.showAdvanced")}
        </Button>

        {showAdvanced ? (
          <div className="space-y-2">
            <input
              value={deviceId}
              onChange={(event) => setDeviceId(event.target.value)}
              placeholder={t("onboarding.check.deviceId")}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            />
            <input
              value={publicKey}
              onChange={(event) => setPublicKey(event.target.value)}
              placeholder={t("onboarding.check.devicePublicKey")}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            />
            <input
              type="password"
              value={privateKey}
              onChange={(event) => setPrivateKey(event.target.value)}
              placeholder={t("onboarding.check.devicePrivateKey")}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            />
            <input
              value={deviceToken}
              onChange={(event) => setDeviceToken(event.target.value)}
              placeholder={t("onboarding.check.deviceToken")}
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
            {t("onboarding.check.saveReconnect")}
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
            {t("onboarding.check.clearToken")}
          </Button>
        </div>
      </div>

      <Separator />

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={() => void fetchConfig()}>
          {t("common.retry")}
        </Button>
        <Button
          type="button"
          disabled={!canContinue}
          onClick={() => {
            setStep("model");
            router.push("/model");
          }}
        >
          {t("common.next")}
        </Button>
      </div>
    </section>
  );
}
