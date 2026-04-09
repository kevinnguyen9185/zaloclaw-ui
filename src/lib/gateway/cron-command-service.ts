export type CronAction = "list" | "add" | "runs" | "remove";
export type CronScheduleType = "at" | "cron";

export type CronListRequest = {
  action: "list";
};

export type CronRunsRequest = {
  action: "runs";
  id: string;
  limit?: number;
};

export type CronRemoveRequest = {
  action: "remove";
  id: string;
};

export type CronAddRequest = {
  action: "add";
  scheduleType: CronScheduleType;
  name: string;
  session: string;
  message: string;
  cron?: string;
  at?: string;
  tz?: string;
  channel?: "zalo" | "last";
  account?: string;
  wakeNow?: boolean;
  deleteAfterRun?: boolean;
};

export type CronActionRequest =
  | CronListRequest
  | CronRunsRequest
  | CronRemoveRequest
  | CronAddRequest;

export type CronActionResult = {
  ok: boolean;
  action: CronAction;
  command: string;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  metadata?: Record<string, string | number | boolean>;
};

type CronActionErrorResponse = {
  error?: unknown;
};

function readErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return fallback;
  }

  const record = payload as CronActionErrorResponse;
  return typeof record.error === "string" && record.error.trim().length > 0
    ? record.error
    : fallback;
}

export async function runCronAction(
  request: CronActionRequest
): Promise<CronActionResult> {
  const response = await fetch("/api/gateway/cron-action", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  const payload = (await response.json()) as unknown;

  if (!response.ok) {
    throw new Error(readErrorMessage(payload, "Failed to execute cron action."));
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Invalid cron action response.");
  }

  const result = payload as Partial<CronActionResult>;
  return {
    ok: result.ok === true,
    action: (result.action ?? request.action) as CronAction,
    command: typeof result.command === "string" ? result.command : `cron:${request.action}`,
    exitCode: typeof result.exitCode === "number" ? result.exitCode : null,
    stdout: typeof result.stdout === "string" ? result.stdout : "",
    stderr: typeof result.stderr === "string" ? result.stderr : "",
    timedOut: result.timedOut === true,
    metadata:
      result.metadata && typeof result.metadata === "object" && !Array.isArray(result.metadata)
        ? (result.metadata as Record<string, string | number | boolean>)
        : undefined,
  };
}
