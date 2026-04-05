import { spawn } from "node:child_process";

import { NextResponse } from "next/server";

type OpenclawCommandRequest = {
  command?: unknown;
};

type ExecutionResult = {
  ok: boolean;
  command: string;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
};

const DEFAULT_CONTAINER_NAME = "zaloclaw-infra-openclaw-gateway-1";
const DEFAULT_TIMEOUT_MS = 20_000;
const MAX_COMMAND_LENGTH = 512;
const UNSAFE_TOKEN_PATTERN = /[;&|`$<>\n\r]/;

function readCommand(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function tokenizeSubcommand(command: string): string[] {
  if (!command) {
    throw new Error("Command is required.");
  }

  if (command.length > MAX_COMMAND_LENGTH) {
    throw new Error("Command is too long.");
  }

  if (UNSAFE_TOKEN_PATTERN.test(command)) {
    throw new Error("Command contains unsafe characters.");
  }

  const normalized = command.startsWith("openclaw ")
    ? command.slice("openclaw ".length).trim()
    : command;

  const parts = normalized.split(/\s+/).filter((part) => part.length > 0);
  if (parts.length === 0) {
    throw new Error("Command is required.");
  }

  return parts;
}

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

async function executeOpenclawCommand(command: string): Promise<ExecutionResult> {
  const subcommand = tokenizeSubcommand(command);
  const containerName = getContainerName();
  const timeoutMs = getTimeoutMs();

  const args = [
    "exec",
    "-i",
    "--user",
    "node",
    containerName,
    "openclaw",
    ...subcommand,
  ];

  return await new Promise<ExecutionResult>((resolve) => {
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
        command,
        exitCode: null,
        stdout,
        stderr: `${stderr}${stderr ? "\n" : ""}${error.message}`.trim(),
        timedOut,
      });
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({
        ok: !timedOut && code === 0,
        command,
        exitCode: code,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        timedOut,
      });
    });
  });
}

export async function POST(request: Request) {
  let body: OpenclawCommandRequest;

  try {
    body = (await request.json()) as OpenclawCommandRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const command = readCommand(body.command);
  if (!command) {
    return NextResponse.json({ error: "Command is required." }, { status: 400 });
  }

  try {
    const result = await executeOpenclawCommand(command);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to execute command.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
