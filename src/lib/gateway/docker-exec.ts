import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";

export type DockerExecResult = {
  ok: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
};

export type DockerExecRunOptions = {
  timeoutMs?: number;
  stdinMode?: "ignore" | "pipe";
};

export const DEFAULT_OPENCLAW_GATEWAY_CONTAINER = "zaloclaw-infra-openclaw-gateway-1";
export const DEFAULT_OPENCLAW_COMMAND_TIMEOUT_MS = 20_000;

export function getOpenclawGatewayContainerName(): string {
  const configured = process.env.OPENCLAW_GATEWAY_CONTAINER?.trim();
  return configured && configured.length > 0
    ? configured
    : DEFAULT_OPENCLAW_GATEWAY_CONTAINER;
}

export function getOpenclawCommandTimeoutMs(): number {
  const raw = process.env.OPENCLAW_COMMAND_TIMEOUT_MS?.trim();
  const parsed = raw ? Number(raw) : Number.NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_OPENCLAW_COMMAND_TIMEOUT_MS;
  }

  return Math.floor(parsed);
}

export function buildGatewayDockerExecArgs(commandTokens: string[]): string[] {
  return [
    "exec",
    "-i",
    "--user",
    "node",
    getOpenclawGatewayContainerName(),
    ...commandTokens,
  ];
}

export async function runGatewayDockerExec(
  commandTokens: string[],
  options: DockerExecRunOptions = {}
): Promise<DockerExecResult> {
  const timeoutMs = options.timeoutMs ?? getOpenclawCommandTimeoutMs();
  const stdinMode = options.stdinMode ?? "ignore";

  return await new Promise<DockerExecResult>((resolve) => {
    const child = spawn("docker", buildGatewayDockerExecArgs(commandTokens), {
      stdio: [stdinMode, "pipe", "pipe"],
    }) as ChildProcessWithoutNullStreams;

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
        exitCode: null,
        stdout: stdout.trim(),
        stderr: `${stderr}${stderr ? "\n" : ""}${error.message}`.trim(),
        timedOut,
      });
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({
        ok: !timedOut && code === 0,
        exitCode: code,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        timedOut,
      });
    });
  });
}
