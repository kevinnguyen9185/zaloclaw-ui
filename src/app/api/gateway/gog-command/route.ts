import { spawn } from "node:child_process";

import { NextResponse } from "next/server";

import {
  getContainerName,
  getTimeoutMs,
  parseNonInteractiveGogCommand,
  readCommand,
} from "@/lib/gateway/gog-command";

type GogCommandRequest = {
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

async function executeGogCommand(command: string): Promise<ExecutionResult> {
  const parsed = parseNonInteractiveGogCommand(command);
  const containerName = getContainerName();
  const timeoutMs = getTimeoutMs();

  const args = ["exec", "-i", "--user", "node", containerName, ...parsed.tokens];

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
        command: parsed.normalizedCommand,
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
        command: parsed.normalizedCommand,
        exitCode: code,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        timedOut,
      });
    });
  });
}

export async function POST(request: Request) {
  let body: GogCommandRequest;

  try {
    body = (await request.json()) as GogCommandRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const command = readCommand(body.command);
  if (!command) {
    return NextResponse.json({ error: "Command is required." }, { status: 400 });
  }

  try {
    const result = await executeGogCommand(command);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to execute command.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
