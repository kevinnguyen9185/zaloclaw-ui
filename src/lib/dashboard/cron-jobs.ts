import type {
  CronActionResult,
  CronScheduleType,
} from "@/lib/gateway/cron-command-service";

export type CronJob = {
  id: string;
  name: string;
  schedule: string;
  session: string;
  message: string;
  agent: string | null;
  model: string | null;
  raw: unknown;
};
 
export type CronRun = {
  id: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  summary: string;
  raw: unknown;
};

export type CronAddInput = {
  scheduleType: CronScheduleType;
  name: string;
  session: string;
  message: string;
  at: string;
  cronMode: "hour" | "day" | "month";
  triggerTime: string;
  triggerDayOfMonth: string;
  tz: string;
  deliveryChannel: "none" | "zalo";
  senderId: string;
  wakeNow: boolean;
  deleteAfterRun: boolean;
};

const MAX_RUNS_LIMIT = 100;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readTimeText(value: unknown): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed;
  }

  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return new Date(value).toISOString();
  }

  return "";
}

function readFirstText(obj: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = readText(obj[key]);
    if (value) {
      return value;
    }
  }
  return "";
}

function parseJsonValue(raw: string): unknown {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return null;
  }
}

function normalizeCronJobId(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const uuidMatch = trimmed.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i
  );
  if (uuidMatch?.[0]) {
    return uuidMatch[0];
  }

  return trimmed;
}

function mapJobFromObject(value: Record<string, unknown>, index: number): CronJob {
  const idCandidate = readFirstText(value, ["id", "jobId", "job_id", "uid"]);
  const id = normalizeCronJobId(idCandidate) || `job-${index + 1}`;
  const name = readFirstText(value, ["name", "title"]) || id;
  const schedule =
    readFirstText(value, ["cron", "schedule", "expression"]) ||
    readFirstText(value, ["at", "runAt", "run_at"]) ||
    "unknown";
  const session = readFirstText(value, ["session", "sessionId", "session_id"]) || "main";
  const message = readFirstText(value, ["message", "prompt", "systemEvent", "system_event"]);
  const agent = readFirstText(value, ["agent", "agentId", "agent_id"]);
  const model = readFirstText(value, ["model", "modelId", "model_id"]);

  return {
    id,
    name,
    schedule,
    session,
    message,
    agent: agent || null,
    model: model || null,
    raw: value,
  };
}

function mapRunFromObject(value: Record<string, unknown>, index: number): CronRun {
  const id =
    readFirstText(value, ["id", "runId", "run_id", "sessionId", "session_id"]) ||
    `${readFirstText(value, ["jobId", "job_id"]) || "run"}-${readText(value.ts) || index + 1}`;
  const status = readFirstText(value, ["status", "state", "result"]) || "unknown";
  const startedAt =
    readFirstText(value, ["startedAt", "started_at", "createdAt", "created_at"]) ||
    readTimeText(value.runAtMs) ||
    readTimeText(value.ts) ||
    "-";
  const finishedAt =
    readFirstText(value, ["finishedAt", "finished_at", "endedAt", "ended_at"]) ||
    readTimeText(value.ts) ||
    null;
  const summary =
    readFirstText(value, ["summary", "message", "error", "stdout", "stderr"]) || "-";

  return {
    id,
    status,
    startedAt,
    finishedAt,
    summary,
    raw: value,
  };
}

function isCronListHeaderLine(line: string): boolean {
  return /^id\s+name\s+schedule\s+next\s+last\s+status\s+target/i.test(line);
}

function isTableBorderLine(line: string): boolean {
  return /^[\s|+\-_=:.~]+$/.test(line) || /^[\s\u2500-\u257F]+$/.test(line);
}

function isCronListNoiseLine(line: string): boolean {
  const normalized = line.trim();
  if (!normalized) {
    return true;
  }

  if (isCronListHeaderLine(normalized)) {
    return true;
  }

  if (isTableBorderLine(normalized)) {
    return true;
  }

  return /^(no\s+cron\s+jobs?|empty)$/i.test(normalized);
}

function splitCronTableColumns(line: string): string[] {
  const pipeColumns = line
    .split("|")
    .map((column) => column.trim())
    .filter((column) => column.length > 0);

  if (pipeColumns.length >= 3) {
    return pipeColumns;
  }

  return line
    .split(/\s{2,}/)
    .map((column) => column.trim())
    .filter((column) => column.length > 0);
}

function mapFallbackJobFromLine(line: string, index: number): CronJob {
  const columns = splitCronTableColumns(line);

  if (columns.length >= 3) {
    const id = normalizeCronJobId(columns[0] || "") || `line-${index + 1}`;

    return {
      id,
      name: columns[1] || columns[0] || `line-${index + 1}`,
      schedule: columns[2] || "unknown",
      session: "main",
      message: "",
      agent: null,
      model: null,
      raw: line,
    };
  }

  return {
    id: `line-${index + 1}`,
    name: line,
    schedule: "unknown",
    session: "main",
    message: "",
    agent: null,
    model: null,
    raw: line,
  };
}

function parseFallbackJobs(stdout: string): CronJob[] {
  return stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => !isCronListNoiseLine(line))
    .map((line, index) => mapFallbackJobFromLine(line, index));
}

function parseFallbackRuns(stdout: string): CronRun[] {
  return stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line, index) => ({
      id: `line-${index + 1}`,
      status: "unknown",
      startedAt: "-",
      finishedAt: null,
      summary: line,
      raw: line,
    }));
}

export function parseCronListOutput(stdout: string): CronJob[] {
  const parsed = parseJsonValue(stdout);

  if (Array.isArray(parsed)) {
    return parsed
      .filter((entry): entry is Record<string, unknown> => isObject(entry))
      .map((entry, index) => mapJobFromObject(entry, index));
  }

  if (isObject(parsed) && Array.isArray(parsed.jobs)) {
    return parsed.jobs
      .filter((entry): entry is Record<string, unknown> => isObject(entry))
      .map((entry, index) => mapJobFromObject(entry, index));
  }

  return parseFallbackJobs(stdout);
}

export function parseCronRunsOutput(stdout: string): CronRun[] {
  const parsed = parseJsonValue(stdout);

  if (Array.isArray(parsed)) {
    return parsed
      .filter((entry): entry is Record<string, unknown> => isObject(entry))
      .map((entry, index) => mapRunFromObject(entry, index));
  }

  if (isObject(parsed) && Array.isArray(parsed.runs)) {
    return parsed.runs
      .filter((entry): entry is Record<string, unknown> => isObject(entry))
      .map((entry, index) => mapRunFromObject(entry, index));
  }

  if (isObject(parsed) && Array.isArray(parsed.entries)) {
    return parsed.entries
      .filter((entry): entry is Record<string, unknown> => isObject(entry))
      .map((entry, index) => mapRunFromObject(entry, index));
  }

  if (isObject(parsed) && isObject(parsed.payload)) {
    const payload = parsed.payload;

    if (Array.isArray(payload.runs)) {
      return payload.runs
        .filter((entry): entry is Record<string, unknown> => isObject(entry))
        .map((entry, index) => mapRunFromObject(entry, index));
    }

    if (Array.isArray(payload.entries)) {
      return payload.entries
        .filter((entry): entry is Record<string, unknown> => isObject(entry))
        .map((entry, index) => mapRunFromObject(entry, index));
    }
  }

  return parseFallbackRuns(stdout);
}

export function validateCronAddInput(input: CronAddInput): {
  ok: boolean;
  fieldErrors: Partial<Record<keyof CronAddInput, string>>;
} {
  const fieldErrors: Partial<Record<keyof CronAddInput, string>> = {};

  if (!input.name.trim()) {
    fieldErrors.name = "required";
  }

  if (!input.session.trim()) {
    fieldErrors.session = "required";
  }

  if (!input.message.trim()) {
    fieldErrors.message = "required";
  }

  if (input.scheduleType === "at") {
    if (!input.at.trim()) {
      fieldErrors.at = "required";
    }
  } else {
    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(input.triggerTime.trim())) {
      fieldErrors.triggerTime = "invalid";
    }

    if (input.cronMode === "month") {
      const day = Number(input.triggerDayOfMonth);
      if (!Number.isInteger(day) || day < 1 || day > 31) {
        fieldErrors.triggerDayOfMonth = "invalid";
      }
    }

    const tzText = input.tz.trim();
    if (tzText) {
      try {
        new Intl.DateTimeFormat("en-US", { timeZone: tzText });
      } catch {
        fieldErrors.tz = "invalid";
      }
    }
  }

  if (input.deliveryChannel === "zalo" && !input.senderId.trim()) {
    fieldErrors.senderId = "required";
  }

  return {
    ok: Object.keys(fieldErrors).length === 0,
    fieldErrors,
  };
}

export function extractZaloSenderIdsFromChannelsStatus(payload: unknown): string[] {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return [];
  }

  const root = payload as Record<string, unknown>;
  const channelAccounts =
    typeof root.channelAccounts === "object" &&
    root.channelAccounts !== null &&
    !Array.isArray(root.channelAccounts)
      ? (root.channelAccounts as Record<string, unknown>)
      : null;

  const zaloAccounts = Array.isArray(channelAccounts?.zalo) ? channelAccounts.zalo : [];

  const senderIds = zaloAccounts
    .map((entry) => {
      if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
        return "";
      }

      const account = entry as Record<string, unknown>;
      const candidate =
        readText(account.accountId) ||
        readText(account.sender_id) ||
        readText(account.senderId) ||
        readText(account.id);

      return candidate;
    })
    .filter((value) => value.length > 0);

  return [...new Set(senderIds)];
}

export function buildCronExpressionFromTrigger(input: CronAddInput): string {
  const [hourText, minuteText] = input.triggerTime.trim().split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return "";
  }

  if (input.cronMode === "hour") {
    return `${minute} * * * *`;
  }

  if (input.cronMode === "day") {
    return `${minute} ${hour} * * *`;
  }

  const day = Number(input.triggerDayOfMonth);
  if (!Number.isInteger(day) || day < 1 || day > 31) {
    return "";
  }

  return `${minute} ${hour} ${day} * *`;
}

export function buildCronRunsLimit(value: number | null | undefined): number {
  if (!Number.isFinite(value)) {
    return 50;
  }

  const rounded = Math.floor(value as number);
  if (rounded < 1) {
    return 1;
  }

  if (rounded > MAX_RUNS_LIMIT) {
    return MAX_RUNS_LIMIT;
  }

  return rounded;
}

export function summarizeCronActionResult(result: CronActionResult): string {
  if (result.ok) {
    return result.stdout.trim() || "OK";
  }

  if (result.stderr.trim()) {
    return result.stderr.trim();
  }

  if (result.timedOut) {
    return "Command timed out";
  }

  return `Failed (${result.exitCode ?? "unknown"})`;
}
