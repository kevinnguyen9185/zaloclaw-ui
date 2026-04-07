"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardChat } from "@/lib/dashboard/chat";
import {
  buildOperatorResultSummary,
  validateOperatorCommandInput,
} from "@/lib/dashboard/operator-command";
import {
  runOpenclawCommand,
  type OpenclawCommandResult,
} from "@/lib/gateway/openclaw-command-service";
import { useLocalization } from "@/lib/i18n/context";

const QUICK_COMMANDS = [
  "openclaw pairing list",
  "openclaw pairing requests",
  "openclaw pairing approve --all",
];

function resolveValidationMessage(
  code: "empty" | "mustStartWithOpenclaw" | "unsafe" | null,
  t: (key: string) => string
): string {
  if (code === "empty") {
    return t("dashboard.command.validation.empty");
  }
  if (code === "mustStartWithOpenclaw") {
    return t("dashboard.command.validation.prefix");
  }
  if (code === "unsafe") {
    return t("dashboard.command.validation.unsafe");
  }

  return "";
}

export function DashboardOperatorCommandSection() {
  const { t } = useLocalization();
  const { startCommandJob, completeCommandJob } = useDashboardChat();

  const [command, setCommand] = useState("openclaw pairing list");
  const [isRunning, setIsRunning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<OpenclawCommandResult | null>(null);

  const executeCommand = async (rawCommand: string) => {
    const validation = validateOperatorCommandInput(rawCommand);
    if (!validation.ok) {
      setErrorMessage(resolveValidationMessage(validation.error, t));
      return;
    }

    setIsRunning(true);
    setErrorMessage(null);
    const jobId = startCommandJob(validation.normalized);

    try {
      const nextResult = await runOpenclawCommand(validation.normalized);
      setResult(nextResult);

      completeCommandJob(jobId, {
        status: nextResult.ok ? "done" : "failed",
        summary: buildOperatorResultSummary(nextResult),
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("dashboard.command.result.requestFailed");

      setErrorMessage(message);
      completeCommandJob(jobId, {
        status: "failed",
        summary: message,
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <section aria-label={t("dashboard.command.title")} className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-foreground">{t("dashboard.command.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("dashboard.command.subtitle")}</p>
      </div>

      <Card className="border border-border/80 bg-card/90">
        <CardHeader className="space-y-2">
          <CardTitle className="text-sm font-semibold">{t("dashboard.command.inputLabel")}</CardTitle>
          <p className="text-xs text-muted-foreground">{t("dashboard.command.scopeHint")}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={command}
              onChange={(event) => {
                setCommand(event.target.value);
                setErrorMessage(null);
              }}
              placeholder={t("dashboard.command.placeholder")}
              className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            />
            <Button
              type="button"
              disabled={isRunning}
              onClick={() => void executeCommand(command)}
            >
              {isRunning ? t("dashboard.command.running") : t("dashboard.command.run")}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {QUICK_COMMANDS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setCommand(item);
                  setErrorMessage(null);
                }}
                className="rounded-full border border-border/80 bg-muted/60 px-2 py-1 text-xs text-foreground transition-colors hover:bg-muted"
              >
                {item}
              </button>
            ))}
          </div>

          {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

          {result ? (
            <Card className="border border-border/60 bg-background/70">
              <CardContent className="space-y-2 pt-4 text-xs text-muted-foreground">
                <p>
                  {`${t("dashboard.command.result.exitCode")} ${result.exitCode ?? "unknown"}`}
                </p>
                <p>{`${t("dashboard.command.result.timedOut")} ${result.timedOut ? t("dashboard.command.result.yes") : t("dashboard.command.result.no")}`}</p>
                <div>
                  <p className="mb-1 font-medium text-foreground">{t("dashboard.command.result.stdout")}</p>
                  <pre className="max-h-40 overflow-auto rounded-md border border-border/60 bg-background p-2 text-[11px] leading-relaxed text-foreground/90">
                    {result.stdout || "-"}
                  </pre>
                </div>
                <div>
                  <p className="mb-1 font-medium text-foreground">{t("dashboard.command.result.stderr")}</p>
                  <pre className="max-h-40 overflow-auto rounded-md border border-border/60 bg-background p-2 text-[11px] leading-relaxed text-foreground/90">
                    {result.stderr || "-"}
                  </pre>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
