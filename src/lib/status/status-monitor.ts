import type {
  ConnectionStatusSnapshot,
  ServiceName,
  ServiceStatus,
} from "@/lib/status/types";
import {
  createInitialConnectionStatusSnapshot,
} from "@/lib/status/types";

type CheckResult = { connected: boolean; error: string | null };

type MonitorOptions = {
  intervalMs?: number;
  failureThreshold?: number;
  checkOpenclaw: () => Promise<CheckResult>;
  checkZalo: () => Promise<CheckResult>;
  onUpdate: (snapshot: ConnectionStatusSnapshot) => void;
  onPersistentFailure?: (service: ServiceName) => void;
};

const DEFAULT_INTERVAL_MS = 30_000;
const DEFAULT_FAILURE_THRESHOLD = 2;

function createDisconnectedStatus(
  previous: ServiceStatus,
  now: number,
  error: string | null,
  failureThreshold: number
): ServiceStatus {
  const failures = previous.consecutiveFailures + 1;
  // Grace period only applies to an already-established connection.
  // If the previous state was "unknown" (first-ever check), go straight to disconnected.
  const persistent = previous.state === "unknown" || failures >= failureThreshold;

  return {
    state: persistent ? "disconnected" : "connected",
    error: persistent ? error : null,
    lastCheckedAt: now,
    consecutiveFailures: failures,
  };
}

function createConnectedStatus(now: number): ServiceStatus {
  return {
    state: "connected",
    error: null,
    lastCheckedAt: now,
    consecutiveFailures: 0,
  };
}

export class ConnectionStatusMonitor {
  private readonly intervalMs: number;
  private readonly failureThreshold: number;
  private readonly checkOpenclaw: () => Promise<CheckResult>;
  private readonly checkZalo: () => Promise<CheckResult>;
  private readonly onUpdate: (snapshot: ConnectionStatusSnapshot) => void;
  private readonly onPersistentFailure?: (service: ServiceName) => void;

  private timer: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;
  private inFlight = false;
  private snapshot: ConnectionStatusSnapshot =
    createInitialConnectionStatusSnapshot();

  constructor(options: MonitorOptions) {
    this.intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;
    this.failureThreshold = options.failureThreshold ?? DEFAULT_FAILURE_THRESHOLD;
    this.checkOpenclaw = options.checkOpenclaw;
    this.checkZalo = options.checkZalo;
    this.onUpdate = options.onUpdate;
    this.onPersistentFailure = options.onPersistentFailure;
  }

  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.timer = setInterval(() => {
      void this.tick(false);
    }, this.intervalMs);

    void this.tick(true);
  }

  stop(): void {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async checkNow(): Promise<void> {
    await this.tick(true);
  }

  getSnapshot(): ConnectionStatusSnapshot {
    return this.snapshot;
  }

  private async tick(force = false): Promise<void> {
    if (this.inFlight) {
      return;
    }

    if (!force && !this.isRunning) {
      return;
    }

    if (!force && typeof document !== "undefined" && document.visibilityState === "hidden") {
      return;
    }

    this.inFlight = true;
    this.snapshot = {
      ...this.snapshot,
      isChecking: true,
    };
    this.onUpdate(this.snapshot);

    const now = Date.now();
    const [openclawResult, zaloResult] = await Promise.all([
      this.safeCheck(this.checkOpenclaw),
      this.safeCheck(this.checkZalo),
    ]);

    const openclaw = openclawResult.connected
      ? createConnectedStatus(now)
      : createDisconnectedStatus(
          this.snapshot.openclaw,
          now,
          openclawResult.error,
          this.failureThreshold
        );
    const zalo = zaloResult.connected
      ? createConnectedStatus(now)
      : createDisconnectedStatus(
          this.snapshot.zalo,
          now,
          zaloResult.error,
          this.failureThreshold
        );

    if (openclaw.state === "disconnected" && this.snapshot.openclaw.state !== "disconnected") {
      this.onPersistentFailure?.("openclaw");
    }
    if (zalo.state === "disconnected" && this.snapshot.zalo.state !== "disconnected") {
      this.onPersistentFailure?.("zalo");
    }

    this.snapshot = {
      openclaw,
      zalo,
      isChecking: false,
      lastCheckAt: now,
    };
    this.inFlight = false;
    this.onUpdate(this.snapshot);
  }

  private async safeCheck(
    checker: () => Promise<CheckResult>
  ): Promise<CheckResult> {
    try {
      return await checker();
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : "Unknown status check error",
      };
    }
  }
}
