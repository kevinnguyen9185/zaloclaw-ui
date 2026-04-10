import { NextResponse } from "next/server";

import {
  parseNonInteractiveGogCommand,
  readCommand,
} from "@/lib/gateway/gog-command";
import { runGatewayDockerExec } from "@/lib/gateway/docker-exec";

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
  const result = await runGatewayDockerExec(parsed.tokens);

  return {
    ...result,
    command: parsed.normalizedCommand,
  };
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
