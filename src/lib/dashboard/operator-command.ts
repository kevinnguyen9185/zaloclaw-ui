import type { OpenclawCommandResult } from "@/lib/gateway/openclaw-command-service";

const UNSAFE_TOKEN_PATTERN = /[;&|`$<>\n\r]/;

export function validateOperatorCommandInput(command: string): {
  ok: boolean;
  normalized: string;
  error: "empty" | "mustStartWithOpenclaw" | "unsafe" | null;
} {
  const normalized = command.trim();

  if (!normalized) {
    return { ok: false, normalized: "", error: "empty" };
  }

  if (!normalized.toLowerCase().startsWith("openclaw ")) {
    return { ok: false, normalized, error: "mustStartWithOpenclaw" };
  }

  if (UNSAFE_TOKEN_PATTERN.test(normalized)) {
    return { ok: false, normalized, error: "unsafe" };
  }

  return { ok: true, normalized, error: null };
}

export function buildOperatorResultSummary(result: OpenclawCommandResult): string {
  if (result.ok) {
    if (result.stdout.trim().length > 0) {
      return result.stdout.trim().split("\n")[0];
    }
    return "Command completed";
  }

  if (result.stderr.trim().length > 0) {
    return result.stderr.trim().split("\n")[0];
  }

  if (result.timedOut) {
    return "Command timed out";
  }

  return `Command failed (exit ${result.exitCode ?? "unknown"})`;
}
