import { describe, it, expect } from "vitest";
import WebSocket from "ws";
import { signAsync } from "@noble/ed25519";

const token = process.env.GATEWAY_TOKEN ?? "";
const session = process.env.GATEWAY_SESSION ?? "main";
const deviceId = process.env.GATEWAY_DEVICE_ID ?? "";
const publicKey = process.env.GATEWAY_DEVICE_PUBLIC_KEY ?? "";
const privateKey = process.env.GATEWAY_DEVICE_PRIVATE_KEY ?? "";
const deviceToken = process.env.GATEWAY_DEVICE_TOKEN ?? "";

const hasRequired = Boolean(token && deviceId && publicKey && privateKey);

function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  return new Uint8Array(Buffer.from(normalized, "base64"));
}

function toBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function signPayload(args: {
  deviceId: string;
  clientId: string;
  clientMode: string;
  role: string;
  scopes: string[];
  signedAtMs: number;
  token: string;
  nonce: string;
}): string {
  return [
    "v2",
    args.deviceId,
    args.clientId,
    args.clientMode,
    args.role,
    args.scopes.join(","),
    String(args.signedAtMs),
    args.token,
    args.nonce,
  ].join("|");
}

async function openAndConnect(): Promise<WebSocket> {
  const ws = new WebSocket(
    `ws://localhost:18789/chat?session=${encodeURIComponent(session)}&token=${encodeURIComponent(token)}`,
    {
      headers: {
        Origin: "http://localhost:18789",
      },
    }
  );

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Socket open timeout"));
    }, 10000);

    ws.once("open", () => {
      clearTimeout(timeout);
      resolve();
    });

    ws.once("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Handshake timeout"));
    }, 10000);

    const onMessage = async (data: WebSocket.RawData) => {
      const text = data.toString();
      let msg: Record<string, unknown>;

      try {
        msg = JSON.parse(text) as Record<string, unknown>;
      } catch {
        return;
      }

      if (msg.type === "event" && msg.event === "connect.challenge") {
        const nonce =
          typeof (msg.payload as { nonce?: unknown } | undefined)?.nonce ===
          "string"
            ? (msg.payload as { nonce: string }).nonce
            : "";

        const clientId = "openclaw-control-ui";
        const clientMode = "webchat";
        const role = "operator";
        const scopes = [
          "operator.admin",
          "operator.read",
          "operator.write",
          "operator.approvals",
          "operator.pairing",
        ];
        const signedAt = Date.now();

        const signature = await signAsync(
          new TextEncoder().encode(
            signPayload({
              deviceId,
              clientId,
              clientMode,
              role,
              scopes,
              signedAtMs: signedAt,
              token,
              nonce,
            })
          ),
          fromBase64Url(privateKey)
        );

        ws.send(
          JSON.stringify({
            type: "req",
            id: "connect-1",
            method: "connect",
            params: {
              minProtocol: 3,
              maxProtocol: 3,
              client: {
                id: clientId,
                version: "2026.3.23",
                platform: "MacIntel",
                mode: clientMode,
                instanceId: deviceId,
              },
              role,
              scopes,
              device: {
                id: deviceId,
                publicKey,
                signature: toBase64Url(signature),
                signedAt,
                nonce,
              },
              caps: ["tool-events"],
              auth: {
                token,
                ...(deviceToken ? { deviceToken } : {}),
              },
              userAgent:
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
              locale: "en-US",
            },
          })
        );
        return;
      }

      if (msg.type === "res" && msg.id === "connect-1") {
        clearTimeout(timeout);
        ws.off("message", onMessage);

        if (msg.ok !== true) {
          reject(
            new Error(
              `Connect failed: ${JSON.stringify(msg.error ?? msg.payload ?? msg)}`
            )
          );
          return;
        }

        resolve();
      }
    };

    ws.on("message", onMessage);
  });

  return ws;
}

const suite = hasRequired ? describe : describe.skip;

suite("GatewayClient Integration (Real WebSocket)", () => {
  it("connect handshake succeeds and models.list returns data", async () => {
    const ws = await openAndConnect();

    const response = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("models.list timeout"));
      }, 8000);

      const onMessage = (data: WebSocket.RawData) => {
        const text = data.toString();
        let msg: Record<string, unknown>;
        try {
          msg = JSON.parse(text) as Record<string, unknown>;
        } catch {
          return;
        }

        if (msg.type === "res" && msg.id === "models-1") {
          clearTimeout(timeout);
          ws.off("message", onMessage);
          resolve(msg);
        }
      };

      ws.on("message", onMessage);
      ws.send(
        JSON.stringify({
          type: "req",
          id: "models-1",
          method: "models.list",
          params: {},
        })
      );
    });

    expect(response.ok).toBe(true);
    const payload = response.payload as { models?: unknown[] } | undefined;
    expect(Array.isArray(payload?.models)).toBe(true);

    ws.close(1000, "done");
  });
});
