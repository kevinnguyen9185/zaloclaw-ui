export type OpenclawCommandResult = {
  ok: boolean;
  command: string;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
};

type OpenclawCommandErrorResponse = {
  error?: unknown;
};

function readErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return fallback;
  }

  const record = payload as OpenclawCommandErrorResponse;
  return typeof record.error === "string" && record.error.trim().length > 0
    ? record.error
    : fallback;
}

export async function runOpenclawCommand(
  command: string
): Promise<OpenclawCommandResult> {
  const response = await fetch("/api/gateway/openclaw-command", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ command }),
  });

  const payload = (await response.json()) as unknown;

  if (!response.ok) {
    throw new Error(readErrorMessage(payload, "Failed to execute OpenClaw command."));
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Invalid command execution response.");
  }

  const result = payload as Partial<OpenclawCommandResult>;
  return {
    ok: result.ok === true,
    command: typeof result.command === "string" ? result.command : command,
    exitCode: typeof result.exitCode === "number" ? result.exitCode : null,
    stdout: typeof result.stdout === "string" ? result.stdout : "",
    stderr: typeof result.stderr === "string" ? result.stderr : "",
    timedOut: result.timedOut === true,
  };
}
