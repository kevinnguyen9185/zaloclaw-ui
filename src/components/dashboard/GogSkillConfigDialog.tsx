"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Terminal } from "lucide-react";

import { useLocalization } from "@/lib/i18n/context";

type GogSkillConfigDialogProps = {
  open: boolean;
  onClose: () => void;
};

type Phase =
  | "idle"
  | "checking-credential"
  | "no-credential"
  | "checking-connectivity"
  | "connected"
  | "auth-terminal"
  | "auth-verifying"
  | "error";

type GogCommandResult = {
  ok: boolean;
  command: string;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
};

type TerminalDoneEvent = {
  type: "done";
  exitCode: number | null;
};

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

function parseSsePayload(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function hasPresentCredential(stdout: string): boolean {
  return stdout.includes("present");
}

function normalizeOutput(value: string): string {
  return value.replace(/\r\n/g, "\n");
}

export function GogSkillConfigDialog({ open, onClose }: GogSkillConfigDialogProps) {
  const { t } = useLocalization();

  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [emailInput, setEmailInput] = useState("");
  const [commandInput, setCommandInput] = useState(
    "gog auth credentials /home/node/.openclaw/credential.json"
  );
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalLog, setTerminalLog] = useState<string[]>([]);
  const [isRunningCommand, setIsRunningCommand] = useState(false);
  const [lastExitCode, setLastExitCode] = useState<number | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [lastStartedCommand, setLastStartedCommand] = useState<string | null>(null);

  const sourceRef = useRef<EventSource | null>(null);

  const appendLog = useCallback((chunk: string) => {
    if (!chunk) return;
    setTerminalLog((previous) => [...previous, normalizeOutput(chunk)]);
  }, []);

  const closeEventSource = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.close();
      sourceRef.current = null;
    }
  }, []);

  const runGogCommand = useCallback(async (command: string): Promise<GogCommandResult> => {
    const response = await fetch("/api/gateway/gog-command", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ command }),
    });

    const payload = (await response.json()) as unknown;
    if (!response.ok) {
      const message =
        payload && typeof payload === "object" && "error" in payload
          ? String((payload as { error: unknown }).error)
          : t("dashboard.gogSetup.authFailed");
      throw new Error(message);
    }

    return payload as GogCommandResult;
  }, [t]);

  const stopActiveSession = useCallback(async () => {
    closeEventSource();

    if (!activeSessionId) {
      return;
    }

    try {
      await fetch(`/api/gateway/gog-terminal-stop?sessionId=${encodeURIComponent(activeSessionId)}`, {
        method: "DELETE",
      });
    } catch {
      // Ignore stop errors during teardown.
    }

    setIsRunningCommand(false);
    setActiveSessionId(null);
  }, [activeSessionId, closeEventSource]);

  const verifyConnectivity = useCallback(async () => {
    setPhase("auth-verifying");
    setErrorMessage(null);

    try {
      const result = await runGogCommand('gog gmail search "is:unread"');
      if (result.ok) {
        setPhase("connected");
        return;
      }

      setPhase("auth-terminal");
      setErrorMessage(result.stderr || t("dashboard.gogSetup.authFailed"));
    } catch (error) {
      setPhase("auth-terminal");
      setErrorMessage(error instanceof Error ? error.message : t("dashboard.gogSetup.authFailed"));
    }
  }, [runGogCommand, t]);

  const startTerminalSession = useCallback(async (command: string) => {
    const normalized = command.trim();
    if (!normalized) {
      setErrorMessage(t("dashboard.command.validation.empty"));
      return;
    }

    setErrorMessage(null);
    setLastExitCode(null);

    if (isRunningCommand) {
      await stopActiveSession();
    }

    appendLog(`$ ${normalized}\n`);

    const response = await fetch("/api/gateway/gog-terminal-start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ command: normalized }),
    });

    const payload = (await response.json()) as unknown;
    if (!response.ok) {
      const message =
        payload && typeof payload === "object" && "error" in payload
          ? String((payload as { error: unknown }).error)
          : t("dashboard.gogSetup.authFailed");
      setErrorMessage(message);
      return;
    }

    const sessionId =
      payload && typeof payload === "object" && "sessionId" in payload
        ? String((payload as { sessionId: unknown }).sessionId)
        : "";

    if (!sessionId) {
      setErrorMessage(t("dashboard.gogSetup.authSessionExpired"));
      return;
    }

    setActiveSessionId(sessionId);
    setLastStartedCommand(normalized);
    setIsRunningCommand(true);

    closeEventSource();
    const source = new EventSource(
      `/api/gateway/gog-terminal-start?sessionId=${encodeURIComponent(sessionId)}`
    );
    sourceRef.current = source;

    source.addEventListener("stdout", (event) => {
      const payloadValue = parseSsePayload((event as MessageEvent).data);
      if (payloadValue && typeof payloadValue === "object" && "chunk" in payloadValue) {
        appendLog(String((payloadValue as { chunk: unknown }).chunk));
      }
    });

    source.addEventListener("stderr", (event) => {
      const payloadValue = parseSsePayload((event as MessageEvent).data);
      if (payloadValue && typeof payloadValue === "object" && "chunk" in payloadValue) {
        appendLog(String((payloadValue as { chunk: unknown }).chunk));
      }
    });

    source.addEventListener("done", (event) => {
      const payloadValue = parseSsePayload((event as MessageEvent).data) as
        | TerminalDoneEvent
        | null;
      const exitCode = payloadValue?.exitCode ?? null;

      appendLog(`\n${t("dashboard.gogSetup.commandExited")} ${exitCode ?? "unknown"}\n`);
      setLastExitCode(exitCode);
      setIsRunningCommand(false);
      setActiveSessionId(null);
      closeEventSource();

      if (
        normalized.startsWith("gog auth add ") &&
        normalized.endsWith(" --manual") &&
        exitCode === 0
      ) {
        void verifyConnectivity();
      }
    });

    source.addEventListener("timeout", () => {
      appendLog(`\n${t("dashboard.gogSetup.authSessionExpired")}\n`);
      setIsRunningCommand(false);
      setActiveSessionId(null);
      closeEventSource();
    });

    source.onerror = () => {
      setIsRunningCommand(false);
      closeEventSource();
    };
  }, [appendLog, closeEventSource, isRunningCommand, stopActiveSession, t, verifyConnectivity]);

  const checkCredentialAndConnectivity = useCallback(async () => {
    setErrorMessage(null);
    setTerminalLog([]);
    setLastExitCode(null);

    setPhase("checking-credential");
    try {
      const credentialResult = await runGogCommand("__file_check__");
      if (!credentialResult.ok) {
        setPhase("error");
        setErrorMessage(credentialResult.stderr || t("dashboard.gogSetup.authFailed"));
        return;
      }

      if (!hasPresentCredential(credentialResult.stdout)) {
        setPhase("no-credential");
        return;
      }

      setPhase("checking-connectivity");
      const connectivityResult = await runGogCommand('gog gmail search "is:unread"');
      if (connectivityResult.ok) {
        setPhase("connected");
        return;
      }

      setPhase("auth-terminal");
      setErrorMessage(connectivityResult.stderr || null);
    } catch (error) {
      setPhase("error");
      setErrorMessage(error instanceof Error ? error.message : t("dashboard.gogSetup.authFailed"));
    }
  }, [runGogCommand, t]);

  useEffect(() => {
    if (!open) {
      void stopActiveSession();
      setPhase("idle");
      setErrorMessage(null);
      return;
    }

    void checkCredentialAndConnectivity();
  }, [checkCredentialAndConnectivity, open, stopActiveSession]);

  const handleClose = useCallback(() => {
    void stopActiveSession();
    onClose();
  }, [onClose, stopActiveSession]);

  const handleRunInteractiveAuth = useCallback(() => {
    const email = emailInput.trim();
    if (!EMAIL_PATTERN.test(email)) {
      setErrorMessage(t("dashboard.gogSetup.emailInvalid"));
      return;
    }

    setCommandInput(`gog auth add ${email} --manual`);
    void startTerminalSession(`gog auth add ${email} --manual`);
  }, [emailInput, startTerminalSession, t]);

  const handleSendTerminalInput = useCallback(async () => {
    const input = terminalInput.trim();
    if (!input || !activeSessionId) {
      return;
    }

    const response = await fetch("/api/gateway/gog-terminal-input", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionId: activeSessionId, input }),
    });

    if (!response.ok) {
      setErrorMessage(t("dashboard.gogSetup.authSessionExpired"));
      return;
    }

    appendLog(`> ${input}\n`);
    setTerminalInput("");
  }, [activeSessionId, appendLog, t, terminalInput]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-label={t("dashboard.gogSetup.title")}
      onClick={handleClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl border border-border bg-background shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">{t("dashboard.gogSetup.title")}</p>
            <p className="text-xs text-muted-foreground">{t("dashboard.gogSetup.terminalTitle")}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
          >
            {t("dashboard.gogSetup.close")}
          </button>
        </div>

        <div className="space-y-4 px-4 py-4">
          {phase === "checking-credential" || phase === "checking-connectivity" || phase === "auth-verifying" ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>
                {phase === "checking-credential"
                  ? t("dashboard.gogSetup.checkingCredential")
                  : phase === "checking-connectivity"
                    ? t("dashboard.gogSetup.checkingConnectivity")
                    : t("dashboard.gogSetup.authVerifying")}
              </span>
            </div>
          ) : null}

          {phase === "no-credential" ? (
            <div className="space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
              <p className="text-sm font-medium text-foreground">{t("dashboard.gogSetup.credentialMissing")}</p>
              <p className="text-sm text-muted-foreground">{t("dashboard.gogSetup.credentialMissingHint")}</p>
              <button
                type="button"
                onClick={() => void checkCredentialAndConnectivity()}
                className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                {t("dashboard.gogSetup.retry")}
              </button>
            </div>
          ) : null}

          {phase === "connected" ? (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{t("dashboard.gogSetup.connected")}</span>
            </div>
          ) : null}

          {phase === "error" ? (
            <div className="space-y-3 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span>{t("dashboard.gogSetup.authFailed")}</span>
              </div>
              {errorMessage ? <pre className="text-xs text-destructive whitespace-pre-wrap">{errorMessage}</pre> : null}
              <button
                type="button"
                onClick={() => void checkCredentialAndConnectivity()}
                className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                {t("dashboard.gogSetup.retry")}
              </button>
            </div>
          ) : null}

          {phase === "auth-terminal" ? (
            <div className="space-y-3 rounded-lg border border-border/70 bg-muted/10 p-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Terminal className="h-3.5 w-3.5" />
                <span>{t("dashboard.gogSetup.terminalTitle")}</span>
                <span className="rounded-full border border-border px-2 py-0.5">
                  {isRunningCommand
                    ? t("dashboard.gogSetup.commandRunning")
                    : `${t("dashboard.gogSetup.commandExited")} ${lastExitCode ?? "-"}`}
                </span>
              </div>

              {errorMessage ? <p className="text-sm text-destructive whitespace-pre-wrap">{errorMessage}</p> : null}

              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <input
                  value={commandInput}
                  onChange={(event) => setCommandInput(event.target.value)}
                  placeholder={t("dashboard.gogSetup.commandPlaceholder")}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                />
                <button
                  type="button"
                  disabled={isRunningCommand}
                  onClick={() => void startTerminalSession(commandInput)}
                  className="h-9 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                >
                  {t("dashboard.gogSetup.runCommand")}
                </button>
              </div>

              <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                <input
                  value={emailInput}
                  onChange={(event) => setEmailInput(event.target.value)}
                  placeholder={t("dashboard.gogSetup.emailPlaceholder")}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                />
                <button
                  type="button"
                  disabled={isRunningCommand}
                  onClick={() =>
                    void startTerminalSession(
                      "gog auth credentials /home/node/.openclaw/credential.json"
                    )
                  }
                  className="h-9 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                >
                  {t("dashboard.gogSetup.authCredentialsQuickAction")}
                </button>
                <button
                  type="button"
                  disabled={isRunningCommand}
                  onClick={handleRunInteractiveAuth}
                  className="h-9 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                >
                  {t("dashboard.gogSetup.authAddQuickAction")}
                </button>
              </div>

              <pre className="max-h-64 overflow-auto rounded-md border border-border/80 bg-black p-3 font-mono text-xs leading-relaxed text-emerald-200 whitespace-pre-wrap">
                {terminalLog.length > 0
                  ? terminalLog.join("")
                  : `${t("dashboard.gogSetup.commandLabel")}: ${lastStartedCommand ?? "-"}`}
              </pre>

              <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                <input
                  value={terminalInput}
                  onChange={(event) => setTerminalInput(event.target.value)}
                  placeholder={t("dashboard.gogSetup.sendInputPlaceholder")}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                />
                <button
                  type="button"
                  disabled={!isRunningCommand || !activeSessionId}
                  onClick={() => void handleSendTerminalInput()}
                  className="h-9 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                >
                  {t("dashboard.gogSetup.sendInput")}
                </button>
                <button
                  type="button"
                  disabled={!isRunningCommand || !activeSessionId}
                  onClick={() => void stopActiveSession()}
                  className="h-9 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                >
                  {t("dashboard.gogSetup.stopSession")}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
