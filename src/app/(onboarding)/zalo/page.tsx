"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { runOpenclawCommand } from "@/lib/gateway/openclaw-command-service";
import { useGateway } from "@/lib/gateway/context";
import { isZaloConnectedFromChannelsStatus } from "@/lib/gateway/zalo-status";
import { useLocalization } from "@/lib/i18n/context";
import { useOnboarding } from "@/lib/onboarding/context";
import {
  buildPairingApproveCommandFromGuide,
  loadZaloConfigState,
  saveZaloBotToken,
} from "./config-service";

export default function OnboardingZaloPage() {
  const router = useRouter();
  const { status, send } = useGateway();
  const { setZalo, setStep } = useOnboarding();
  const { t } = useLocalization();

  const [checking, setChecking] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [botToken, setBotToken] = useState("");
  const [hasBotToken, setHasBotToken] = useState(false);
  const [savingToken, setSavingToken] = useState(false);
  const [tokenMessage, setTokenMessage] = useState<string | null>(null);
  const [pairingGuide, setPairingGuide] = useState("");
  const [executingGuide, setExecutingGuide] = useState(false);
  const [guideMessage, setGuideMessage] = useState<string | null>(null);
  const [guideMessageTone, setGuideMessageTone] = useState<"success" | "error" | null>(null);
  const [pairingDone, setPairingDone] = useState(false);

  // Set the current step when the page loads
  useEffect(() => {
    setStep("zalo");
  }, [setStep]);

  const checkStatus = useCallback(async () => {
    if (status !== "connected") {
      return;
    }

    setChecking(true);
    setError(null);

    try {
      const response = await send("channels.status", { probe: true });
      setConnected(isZaloConnectedFromChannelsStatus(response));
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : "Failed to fetch channel status";
      setError(message);
    } finally {
      setChecking(false);
    }
  }, [send, status]);

  useEffect(() => {
    if (status !== "connected") {
      return;
    }

    let cancelled = false;

    const loadConfig = async () => {
      try {
        const configState = await loadZaloConfigState(send);
        if (cancelled) {
          return;
        }

        setBotToken(configState.botToken);
        setHasBotToken(configState.hasBotToken);
      } catch (caught) {
        if (cancelled) {
          return;
        }

        const message =
          caught instanceof Error
            ? caught.message
            : t("onboarding.zalo.configLoadError");
        setError(message);
      }
    };

    void loadConfig();
    void checkStatus();

    const timer = window.setInterval(() => {
      void checkStatus();
    }, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [checkStatus, send, status, t]);

  const needsBotToken = !connected || !hasBotToken;
  const canSaveToken =
    status === "connected" && !savingToken && botToken.trim().length > 0;
  const canExecuteGuide =
    status === "connected" &&
    hasBotToken &&
    !executingGuide &&
    pairingGuide.trim().length > 0;

  return (
    <section className="space-y-5">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-primary/90">
          {t("onboarding.zalo.eyebrow")}
        </p>
        <h2 className="font-heading text-2xl font-semibold text-foreground sm:text-[1.75rem]">
          {t("onboarding.zalo.title")}
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t("onboarding.zalo.subtitle")}
        </p>
      </header>

      <div className="space-y-2 rounded-xl border bg-card/80 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">{t("onboarding.zalo.status")}</span>
          <Badge variant={connected ? "default" : "outline"}>
            {connected ? t("common.connected") : t("onboarding.zalo.notPaired")}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {checking ? t("onboarding.zalo.checking") : t("onboarding.zalo.autoRefresh")}
        </p>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>

      {needsBotToken ? (
        <div className="space-y-3 rounded-xl border bg-card/80 p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {t("onboarding.zalo.botTokenLabel")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("onboarding.zalo.botTokenHint")}{" "}
              <a
                href="https://bot.zapps.me/docs/create-bot/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                {t("onboarding.zalo.botTokenHintLink")}
              </a>
            </p>
          </div>

          <input
            id="zalo-bot-token"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            type="password"
            value={botToken}
            placeholder={t("onboarding.zalo.botTokenPlaceholder")}
            onChange={(event) => {
              setBotToken(event.target.value);
              setTokenMessage(null);
            }}
          />

          {tokenMessage ? (
            <p className="text-sm text-muted-foreground">{tokenMessage}</p>
          ) : null}

          <div>
            <Button
              type="button"
              disabled={!canSaveToken}
              onClick={async () => {
                setSavingToken(true);
                setTokenMessage(null);
                try {
                  await saveZaloBotToken(send, botToken);
                  setHasBotToken(true);
                  setTokenMessage(t("onboarding.zalo.botTokenSaved"));
                } catch (caught) {
                  const message =
                    caught instanceof Error
                      ? caught.message
                      : t("onboarding.zalo.botTokenSaveError");
                  setTokenMessage(message);
                } finally {
                  setSavingToken(false);
                }
              }}
            >
              {savingToken
                ? t("onboarding.zalo.botTokenSaving")
                : t("onboarding.zalo.botTokenSave")}
            </Button>
          </div>
        </div>
      ) : null}

      {hasBotToken ? (
        <div className="space-y-3 rounded-xl border bg-card/80 p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {t("onboarding.zalo.pairingGuideLabel")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("onboarding.zalo.pairingGuideHint")}
            </p>
            {pairingDone ? (
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {t("onboarding.zalo.pairingGuideDone")}
              </p>
            ) : null}
          </div>

          <textarea
            id="zalo-pairing-guide"
            className="min-h-32 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            value={pairingGuide}
            placeholder={t("onboarding.zalo.pairingGuidePlaceholder")}
            onChange={(event) => {
              setPairingGuide(event.target.value);
              setGuideMessage(null);
              setGuideMessageTone(null);
              setPairingDone(false);
            }}
          />

          {guideMessage ? (
            <p
              className={`text-sm ${
                guideMessageTone === "success"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : guideMessageTone === "error"
                    ? "text-destructive"
                    : "text-muted-foreground"
              }`}
            >
              {guideMessage}
            </p>
          ) : null}

          <div>
            <Button
              type="button"
              disabled={!canExecuteGuide}
              onClick={async () => {
                setExecutingGuide(true);
                setGuideMessage(null);
                setGuideMessageTone(null);

                try {
                  const command = buildPairingApproveCommandFromGuide(pairingGuide);
                  const result = await runOpenclawCommand(command);
                  if (result.ok) {
                    setPairingDone(true);
                    setConnected(true);
                    setGuideMessage(t("onboarding.zalo.pairingGuideSuccess"));
                    setGuideMessageTone("success");
                  } else {
                    setPairingDone(false);
                    setGuideMessage(
                      `${t("onboarding.zalo.pairingGuideExecuteError")} (${result.stderr || `exit ${result.exitCode ?? "unknown"}`})`
                    );
                    setGuideMessageTone("error");
                  }
                  void checkStatus();
                } catch (caught) {
                  const message =
                    caught instanceof Error
                      ? caught.message
                      : t("onboarding.zalo.pairingGuideExecuteError");
                  setGuideMessage(message);
                  setGuideMessageTone("error");
                } finally {
                  setExecutingGuide(false);
                }
              }}
            >
              {executingGuide
                ? t("onboarding.zalo.pairingGuideExecuting")
                : t("onboarding.zalo.pairingGuideExecute")}
            </Button>
          </div>
        </div>
      ) : null}

      <Separator />

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={() => void checkStatus()}>
          {t("common.refresh")}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setZalo("skipped");
            setStep("complete");
            router.push("/complete");
          }}
        >
          {t("onboarding.zalo.skip")}
        </Button>

        <Button
          type="button"
          disabled={!connected}
          onClick={() => {
            setZalo("connected");
            setStep("complete");
            router.push("/complete");
          }}
        >
          {t("common.next")}
        </Button>
      </div>
    </section>
  );
}
