const WebSocket = require("ws");
const fs = require("node:fs");
const path = require("node:path");
const token = process.env.GATEWAY_TOKEN || "";
const session = process.env.GATEWAY_SESSION || "main";
const STATE_PATH = path.join(process.cwd(), ".tmp-openclaw-device-auth.json");
const savedState = (() => {
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
  } catch {
    return {};
  }
})();
const deviceToken =
  process.env.GATEWAY_DEVICE_TOKEN ||
  savedState.deviceToken ||
  "uICEUdTQGL5WTiv2WHQA2zQus-5HZknTBMdc9gD1DFc";
const deviceId =
  process.env.GATEWAY_DEVICE_ID ||
  "134fc59f5c49e88ba6df0f4f1cbf5f81fe82bbd0ad69e8fcf22a269212e7587e";
const publicKeyB64u =
  process.env.GATEWAY_DEVICE_PUBLIC_KEY ||
  "h9oXcRDZUL4GoMknpcGD0d0e1PzUXR5IavdFJyOyfKk";
const privateKeyB64u =
  process.env.GATEWAY_DEVICE_PRIVATE_KEY ||
  "I1731IwnXTR5x6vN1bBJsliyF0kQEDLgl0jQ-_K-I9E";

function toBase64Url(bytes) {
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  return new Uint8Array(Buffer.from(normalized, "base64"));
}

function buildSignaturePayload({
  deviceId,
  clientId,
  clientMode,
  role,
  scopes,
  signedAtMs,
  authToken,
  nonce,
}) {
  return [
    "v2",
    deviceId,
    clientId,
    clientMode,
    role,
    scopes.join(","),
    String(signedAtMs),
    authToken || "",
    nonce,
  ].join("|");
}

async function run() {
  const ed = await import("@noble/ed25519");
  const privateKeyBytes = fromBase64Url(privateKeyB64u);

  const device = {
    deviceId,
    publicKey: publicKeyB64u,
  };
  const ws = new WebSocket(
    `ws://localhost:18789/chat?session=${encodeURIComponent(session)}&token=${encodeURIComponent(token)}`,
    { headers: { Origin: "http://localhost:18789" } }
  );

  ws.on("open", () => {
    console.log("open");
    if (deviceToken) {
      console.log("using persisted deviceToken");
    }
  });

  ws.on("message", async (data) => {
    const text = data.toString();
    console.log("recv", text);

    let msg;
    try {
      msg = JSON.parse(text);
    } catch {
      return;
    }

    if (msg.type === "event" && msg.event === "connect.challenge") {
      const nonce = msg.payload?.nonce || "";
      const clientId = "openclaw-control-ui";
      const clientMode = "webchat";
      const role = "operator";
      const userAgent =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36";
      const scopes = [
        "operator.admin",
        "operator.read",
        "operator.write",
        "operator.approvals",
        "operator.pairing",
      ];
      const signedAt = Date.now();

      const signPayload = buildSignaturePayload({
        deviceId: device.deviceId,
        clientId,
        clientMode,
        role,
        scopes,
        signedAtMs: signedAt,
        authToken: token,
        nonce,
      });

      const signatureBytes = await ed.signAsync(
        new TextEncoder().encode(signPayload),
        privateKeyBytes
      );

      const connectReq = {
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
            instanceId: device.deviceId,
          },
          role,
          scopes,
          device: {
            id: device.deviceId,
            publicKey: device.publicKey,
            signature: toBase64Url(signatureBytes),
            signedAt,
            nonce,
          },
          caps: ["tool-events"],
          auth: {
            token,
            ...(deviceToken ? { deviceToken } : {}),
          },
          userAgent,
          locale: "en-US",
        },
      };

      console.log("send", JSON.stringify(connectReq));
      ws.send(JSON.stringify(connectReq));
      return;
    }

    if (msg.type === "res" && msg.id === "connect-1") {
      if (msg.ok && msg.payload?.auth?.deviceToken) {
        const nextState = {
          deviceToken: msg.payload.auth.deviceToken,
          updatedAt: Date.now(),
        };
        fs.writeFileSync(STATE_PATH, JSON.stringify(nextState, null, 2));
        console.log("saved updated deviceToken state");
      }

      const req = {
        type: "req",
        id: "models-1",
        method: "models.list",
        params: {},
      };
      console.log("send", JSON.stringify(req));
      ws.send(JSON.stringify(req));
      return;
    }

    if (msg.type === "res" && msg.id === "models-1") {
      console.log("models.list ok", Boolean(msg.ok));
      ws.close(1000, "done");
    }
  });

  ws.on("close", (code, reason) => {
    console.log("close", code, reason.toString());
  });

  ws.on("error", (err) => {
    console.error("error", err.message);
  });

  setTimeout(() => {
    console.log("timeout");
    ws.close(1000, "timeout");
  }, 10000);
}

run().catch((error) => {
  console.error("fatal", error);
  process.exitCode = 1;
});
