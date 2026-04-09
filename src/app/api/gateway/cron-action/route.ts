import { spawn } from "node:child_process";

import { NextResponse } from "next/server";

import {
  buildCronArgs,
  type CronAction,
  type CronActionRequest,
} from "@/lib/gateway/cron-route-args";

type CronExecutionResult = {
  ok: boolean;
  action: CronAction;
  command: string;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  metadata?: Record<string, string | number | boolean>;
};

const DEFAULT_CONTAINER_NAME = "zaloclaw-infra-openclaw-gateway-1";
const DEFAULT_TIMEOUT_MS = 20_000;

function getContainerName(): string {
  const configured = process.env.OPENCLAW_GATEWAY_CONTAINER?.trim();
  return configured && configured.length > 0 ? configured : DEFAULT_CONTAINER_NAME;
}

function getTimeoutMs(): number {
  const raw = process.env.OPENCLAW_COMMAND_TIMEOUT_MS?.trim();
  const parsed = raw ? Number(raw) : NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_TIMEOUT_MS;
  }

  return Math.floor(parsed);
}

async function executeCronAction(
  action: CronAction,
  subcommandArgs: string[],
  metadata?: Record<string, string | number | boolean>
): Promise<CronExecutionResult> {
  const containerName = getContainerName();
  const timeoutMs = getTimeoutMs();

  const args = [
    "exec",
    "-i",
    "--user",
    "node",
    containerName,
    "openclaw",
    "cron",
    ...subcommandArgs,
  ];

  return await new Promise<CronExecutionResult>((resolve) => {
    const child = spawn("docker", args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    child.stdout.on("data", (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, timeoutMs);

    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({
        ok: false,
        action,
        command: `openclaw cron ${subcommandArgs.join(" ")}`,
        exitCode: null,
        stdout: stdout.trim(),
        stderr: `${stderr}${stderr ? "\n" : ""}${error.message}`.trim(),
        timedOut,
        metadata,
      });
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({
        ok: !timedOut && code === 0,
        action,
        command: `openclaw cron ${subcommandArgs.join(" ")}`,
        exitCode: code,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        timedOut,
        metadata,
      });
    });
  });
}

export async function POST(request: Request) {
  let body: CronActionRequest;

  try {
    body = (await request.json()) as CronActionRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const built = buildCronArgs(body);
    const result = await executeCronAction(built.action, built.args, built.metadata);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to execute cron action.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
