export type CronAction = "list" | "add" | "runs" | "remove";
type ScheduleType = "at" | "cron";

export type CronActionRequest = {
  action?: unknown;
  id?: unknown;
  limit?: unknown;
  scheduleType?: unknown;
  name?: unknown;
  session?: unknown;
  message?: unknown;
  cron?: unknown;
  at?: unknown;
  tz?: unknown;
  channel?: unknown;
  account?: unknown;
  wakeNow?: unknown;
  deleteAfterRun?: unknown;
};

const DEFAULT_RUNS_LIMIT = 50;
const MIN_RUNS_LIMIT = 1;
const MAX_RUNS_LIMIT = 100;
const MAX_STRING_LENGTH = 400;
const UNSAFE_TOKEN_PATTERN = /[;&|`$<>\n\r]/;

function readAction(value: unknown): CronAction | null {
  if (value === "list" || value === "add" || value === "runs" || value === "remove") {
    return value;
  }
  return null;
}

function readScheduleType(value: unknown): ScheduleType | null {
  if (value === "at" || value === "cron") {
    return value;
  }
  return null;
}

function readSafeString(value: unknown, field: string, required = true): string {
  if (typeof value !== "string") {
    if (required) {
      throw new Error(`${field} is required.`);
    }
    return "";
  }

  const normalized = value.trim();
  if (!normalized && required) {
    throw new Error(`${field} is required.`);
  }

  if (normalized.length > MAX_STRING_LENGTH) {
    throw new Error(`${field} is too long.`);
  }

  if (UNSAFE_TOKEN_PATTERN.test(normalized)) {
    throw new Error(`${field} contains unsafe characters.`);
  }

  return normalized;
}

function readBoolean(value: unknown): boolean {
  return value === true;
}

function readRunsLimit(value: unknown): number {
  const fallback = DEFAULT_RUNS_LIMIT;

  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error("limit must be a valid number.");
  }

  const rounded = Math.floor(parsed);
  if (rounded < MIN_RUNS_LIMIT || rounded > MAX_RUNS_LIMIT) {
    throw new Error(`limit must be between ${MIN_RUNS_LIMIT} and ${MAX_RUNS_LIMIT}.`);
  }

  return rounded;
}

function readDeliveryChannel(value: unknown): "zalo" | "last" | "" {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  const channel = readSafeString(value, "channel", false);
  if (!channel) {
    return "";
  }

  if (channel !== "zalo" && channel !== "last") {
    throw new Error("channel must be one of: zalo, last.");
  }

  return channel;
}

export function buildCronArgs(body: CronActionRequest): {
  action: CronAction;
  args: string[];
  metadata?: Record<string, string | number | boolean>;
} {
  const action = readAction(body.action);
  if (!action) {
    throw new Error("Unsupported action.");
  }

  if (action === "list") {
    return { action, args: ["list"] };
  }

  if (action === "runs") {
    const id = readSafeString(body.id, "id");
    const limit = readRunsLimit(body.limit);
    return {
      action,
      args: ["runs", "--id", id, "--limit", String(limit)],
      metadata: { id, limit },
    };
  }

  if (action === "remove") {
    const id = readSafeString(body.id, "id");
    return {
      action,
      args: ["remove", id],
      metadata: { id },
    };
  }

  const scheduleType = readScheduleType(body.scheduleType);
  if (!scheduleType) {
    throw new Error("scheduleType must be one of: at, cron.");
  }

  const name = readSafeString(body.name, "name");
  const requestedSession = readSafeString(body.session, "session");
  const message = readSafeString(body.message, "message");

  const channel = readDeliveryChannel(body.channel);
  const recipient = readSafeString(body.account, "account", false);
  const hasDelivery = Boolean(channel || recipient);
  const session = hasDelivery ? "isolated" : requestedSession;

  const messageFlag = session === "main" ? "--system-event" : "--message";
  const args = ["add", "--name", name, "--session", session, messageFlag, message];

  if (scheduleType === "at") {
    const at = readSafeString(body.at, "at");
    args.push("--at", at);

    if (readBoolean(body.wakeNow)) {
      args.push("--wake", "now");
    }

    if (readBoolean(body.deleteAfterRun)) {
      args.push("--delete-after-run");
    }
  } else {
    const cron = readSafeString(body.cron, "cron");
    args.push("--cron", cron);

    const tz = readSafeString(body.tz, "tz", false);
    if (tz) {
      args.push("--tz", tz);
    }
  }

  if (channel) {
    args.push("--channel", channel);
  }

  if (recipient) {
    args.push("--to", recipient);
  }

  if (hasDelivery) {
    args.push("--announce");
  }

  return {
    action,
    args,
    metadata: {
      scheduleType,
      session,
      requestedSession,
      messageFlag,
      hasDelivery,
      channel: channel || "none",
      hasAccount: Boolean(recipient),
    },
  };
}