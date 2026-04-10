import { NextResponse } from "next/server";

import { runGatewayDockerExec } from "@/lib/gateway/docker-exec";

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

async function executeCronAction(
  action: CronAction,
  subcommandArgs: string[],
  metadata?: Record<string, string | number | boolean>
): Promise<CronExecutionResult> {
  const result = await runGatewayDockerExec(["openclaw", "cron", ...subcommandArgs]);

  return {
    ...result,
    action,
    command: `openclaw cron ${subcommandArgs.join(" ")}`,
    metadata,
  };
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
