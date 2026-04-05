"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useGateway } from "@/lib/gateway/context";
import { ConnectionStatusMonitor } from "@/lib/status/status-monitor";
import {
  createInitialConnectionStatusSnapshot,
  type ConnectionStatusSnapshot,
  type ServiceName,
} from "@/lib/status/types";

type ConnectionStatusContextValue = {
  snapshot: ConnectionStatusSnapshot;
  checkNow: () => Promise<void>;
  recoveryService: ServiceName | null;
  dismissRecovery: () => void;
};

const ConnectionStatusContext =
  createContext<ConnectionStatusContextValue | null>(null);

export function ConnectionStatusProvider({ children }: { children: ReactNode }) {
  const { status, checkOpenclawStatus, checkZaloStatus } = useGateway();
  const monitorRef = useRef<ConnectionStatusMonitor | null>(null);
  const [snapshot, setSnapshot] = useState<ConnectionStatusSnapshot>(
    createInitialConnectionStatusSnapshot()
  );
  const [recoveryService, setRecoveryService] = useState<ServiceName | null>(null);

  useEffect(() => {
    const monitor = new ConnectionStatusMonitor({
      intervalMs: 30_000,
      failureThreshold: 2,
      checkOpenclaw: async () => {
        const result = await checkOpenclawStatus();
        return { connected: result.connected, error: result.error };
      },
      checkZalo: async () => {
        const result = await checkZaloStatus();
        return { connected: result.connected, error: result.error };
      },
      onUpdate: (nextSnapshot) => {
        setSnapshot(nextSnapshot);
      },
      onPersistentFailure: (service) => {
        setRecoveryService(service);
      },
    });

    monitorRef.current = monitor;
    return () => {
      monitor.stop();
      monitorRef.current = null;
    };
  }, [checkOpenclawStatus, checkZaloStatus]);

  useEffect(() => {
    if (!monitorRef.current) {
      return;
    }

    if (status === "connected") {
      monitorRef.current.start();
      return;
    }

    monitorRef.current.stop();
    setSnapshot(createInitialConnectionStatusSnapshot());
  }, [status]);

  const checkNow = useCallback(async () => {
    if (!monitorRef.current) {
      return;
    }
    await monitorRef.current.checkNow();
  }, []);

  const dismissRecovery = useCallback(() => {
    setRecoveryService(null);
  }, []);

  const value = useMemo(
    () => ({
      snapshot,
      checkNow,
      recoveryService,
      dismissRecovery,
    }),
    [snapshot, checkNow, recoveryService, dismissRecovery]
  );

  return (
    <ConnectionStatusContext.Provider value={value}>
      {children}
    </ConnectionStatusContext.Provider>
  );
}

export function useConnectionStatus(): ConnectionStatusContextValue {
  const context = useContext(ConnectionStatusContext);
  if (!context) {
    throw new Error("useConnectionStatus must be used within ConnectionStatusProvider");
  }

  return context;
}
