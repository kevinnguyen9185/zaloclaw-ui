export type ServiceName = "openclaw" | "zalo";

export type ServiceConnectionState =
  | "unknown"
  | "checking"
  | "connected"
  | "disconnected";

export type ServiceStatus = {
  state: ServiceConnectionState;
  error: string | null;
  lastCheckedAt: number | null;
  consecutiveFailures: number;
};

export type ConnectionStatusSnapshot = {
  openclaw: ServiceStatus;
  zalo: ServiceStatus;
  isChecking: boolean;
  lastCheckAt: number | null;
};

export function createUnknownServiceStatus(): ServiceStatus {
  return {
    state: "unknown",
    error: null,
    lastCheckedAt: null,
    consecutiveFailures: 0,
  };
}

export function createInitialConnectionStatusSnapshot(): ConnectionStatusSnapshot {
  return {
    openclaw: createUnknownServiceStatus(),
    zalo: createUnknownServiceStatus(),
    isChecking: false,
    lastCheckAt: null,
  };
}
