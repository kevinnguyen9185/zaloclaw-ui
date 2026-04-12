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

import { GatewayClient } from "@/lib/gateway/client";
import type { ConnectionStatus, JsonValue } from "@/lib/gateway/types";

interface GatewayContextValue {
  status: ConnectionStatus;
  error: string | null;
  send: <TResponse extends JsonValue = JsonValue>(
    method: string,
    params?: JsonValue
  ) => Promise<TResponse>;
  subscribe: (
    event: string,
    handler: (payload: JsonValue | undefined) => void
  ) => () => void;
  checkOpenclawStatus: () => Promise<{
    connected: boolean;
    error: string | null;
    checkedAt: number;
  }>;
  checkZaloStatus: () => Promise<{
    connected: boolean;
    error: string | null;
    checkedAt: number;
  }>;
  getServiceStatus: () => {
    openclaw: {
      connected: boolean;
      error: string | null;
      checkedAt: number;
    } | null;
    zalo: {
      connected: boolean;
      error: string | null;
      checkedAt: number;
    } | null;
  };
}

const GatewayContext = createContext<GatewayContextValue | null>(null);

export function GatewayProvider({ children }: { children: ReactNode }) {
  const clientRef = useRef<GatewayClient | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  if (!clientRef.current) {
    clientRef.current = new GatewayClient();
  }

  useEffect(() => {
    const client = clientRef.current;
    if (!client) {
      return;
    }

    const unsubscribe = client.onStatusChange((nextStatus, nextError) => {
      setStatus(nextStatus);
      setError(nextError);
    });

    // Fetch the gateway token server-side so the runtime .env value is used
    // rather than whatever was baked into the JS bundle at build time.
    fetch("/api/gateway/token")
      .then((res) => res.json() as Promise<{ token: string }>)
      .then(({ token }) => {
        client.setEnvToken(token);
      })
      .catch(() => {
        // proceed without token; handshake will surface the error
      })
      .finally(() => {
        client.connect();
      });

    return () => {
      unsubscribe();
      client.disconnect();
    };
  }, []);

  const send = useCallback(
    <TResponse extends JsonValue = JsonValue>(
      method: string,
      params: JsonValue = {}
    ) => {
      if (!clientRef.current) {
        return Promise.reject(new Error("Gateway client is unavailable"));
      }

      return clientRef.current.send<TResponse>(method, params);
    },
    []
  );

  const subscribe = useCallback(
    (event: string, handler: (payload: JsonValue | undefined) => void) => {
      if (!clientRef.current) {
        return () => {};
      }

      return clientRef.current.subscribe(event, handler);
    },
    []
  );

  const checkOpenclawStatus = useCallback(() => {
    if (!clientRef.current) {
      return Promise.resolve({
        connected: false,
        error: "Gateway client is unavailable",
        checkedAt: Date.now(),
      });
    }

    return clientRef.current.checkOpenclawStatus();
  }, []);

  const checkZaloStatus = useCallback(() => {
    if (!clientRef.current) {
      return Promise.resolve({
        connected: false,
        error: "Gateway client is unavailable",
        checkedAt: Date.now(),
      });
    }

    return clientRef.current.checkZaloStatus();
  }, []);

  const getServiceStatus = useCallback(() => {
    if (!clientRef.current) {
      return { openclaw: null, zalo: null };
    }

    return clientRef.current.getServiceStatus();
  }, []);

  const value = useMemo(
    () => ({
      status,
      error,
      send,
      subscribe,
      checkOpenclawStatus,
      checkZaloStatus,
      getServiceStatus,
    }),
    [
      status,
      error,
      send,
      subscribe,
      checkOpenclawStatus,
      checkZaloStatus,
      getServiceStatus,
    ]
  );

  return (
    <GatewayContext.Provider value={value}>{children}</GatewayContext.Provider>
  );
}

export function useGateway(): GatewayContextValue {
  const context = useContext(GatewayContext);
  if (!context) {
    throw new Error("useGateway must be used within GatewayProvider");
  }

  return context;
}
