import { NextResponse } from "next/server";

import { runGatewayDockerExec } from "@/lib/gateway/docker-exec";

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

async function executeOpenclawCommand(command: string): Promise<ExecutionResult> {
  const subcommand = tokenizeSubcommand(command);
  const result = await runGatewayDockerExec(["openclaw", ...subcommand]);

  return {
    ...result,
    command,
  };
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
