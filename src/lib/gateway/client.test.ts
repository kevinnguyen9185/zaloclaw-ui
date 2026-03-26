import { beforeEach, describe, expect, it, vi } from "vitest";

import { GatewayClient } from "@/lib/gateway/client";

class MockWebSocket {
  static instances: MockWebSocket[] = [];

  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  url: string;
  sent: string[] = [];

  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: ((event: { code: number }) => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(code = 1000): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ code });
  }

  triggerOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.();
  }

  triggerMessage(message: unknown): void {
    this.onmessage?.({ data: JSON.stringify(message) });
  }

  triggerClose(code: number): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ code });
  }
}

describe("GatewayClient", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    MockWebSocket.instances.length = 0;
    vi.stubGlobal("WebSocket", MockWebSocket as unknown as typeof WebSocket);

    const storage = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
      },
    });
  });

  it("resolves send() promises by matching response id", async () => {
    const client = new GatewayClient("ws://localhost:18789");
    client.connect();

    const ws = MockWebSocket.instances[0];
    ws.triggerOpen();
    ws.triggerMessage({ event: "hello", token: "abc" });

    const resultPromise = client.send("models.list", {});

    const sent = JSON.parse(ws.sent[0]) as { id: number; method: string };
    expect(sent.method).toBe("models.list");

    ws.triggerMessage({ id: sent.id, result: { models: ["gpt-4"] } });

    await expect(resultPromise).resolves.toEqual({ models: ["gpt-4"] });
  });

  it("reconnects with exponential backoff after unexpected close", () => {
    const client = new GatewayClient("ws://localhost:18789");
    client.connect();

    const ws = MockWebSocket.instances[0];
    ws.triggerOpen();
    ws.triggerMessage({ event: "hello" });

    ws.triggerClose(1006);
    expect(MockWebSocket.instances).toHaveLength(1);

    vi.advanceTimersByTime(999);
    expect(MockWebSocket.instances).toHaveLength(1);

    vi.advanceTimersByTime(1);
    expect(MockWebSocket.instances).toHaveLength(2);

    const ws2 = MockWebSocket.instances[1];
    ws2.triggerClose(1006);

    vi.advanceTimersByTime(1999);
    expect(MockWebSocket.instances).toHaveLength(2);

    vi.advanceTimersByTime(1);
    expect(MockWebSocket.instances).toHaveLength(3);
  });
});
