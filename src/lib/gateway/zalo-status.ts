import type { JsonValue } from "@/lib/gateway/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAccountAlive(account: Record<string, unknown>): boolean {
  const enabled = account.enabled !== false;
  const configured = account.configured === true;
  const running = account.running === true;
  const connected = account.connected === true;

  const probe = isRecord(account.probe) ? account.probe : null;
  const hasProbe = probe !== null;
  const probeOk = probe?.ok === true;

  if (!enabled || !configured) {
    return false;
  }

  if (hasProbe) {
    return probeOk;
  }

  return running || connected;
}

export function isZaloConnectedFromChannelsStatus(payload: JsonValue): boolean {
  if (!isRecord(payload)) {
    return false;
  }

  const accounts = isRecord(payload.channelAccounts)
    ? payload.channelAccounts
    : null;
  const zaloAccounts = Array.isArray(accounts?.zalo) ? accounts.zalo : [];

  if (zaloAccounts.length > 0) {
    return zaloAccounts.some(
      (entry) => isRecord(entry) && isAccountAlive(entry)
    );
  }

  const channels = isRecord(payload.channels) ? payload.channels : null;
  const zaloSummary = isRecord(channels?.zalo) ? channels.zalo : null;
  if (!zaloSummary) {
    return false;
  }

  const configured = zaloSummary.configured === true;
  const running = zaloSummary.running === true;
  const connected = zaloSummary.connected === true;

  const probe = isRecord(zaloSummary.probe) ? zaloSummary.probe : null;
  if (probe) {
    return configured && probe.ok === true;
  }

  return configured && (running || connected);
}
