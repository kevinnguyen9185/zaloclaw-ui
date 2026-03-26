import { NextResponse } from "next/server";

const DEFAULT_GATEWAY_URL = "ws://localhost:18789";

function toHttpBaseUrl(url: string): string {
  const parsed = new URL(url);

  if (parsed.protocol === "ws:") {
    parsed.protocol = "http:";
  }

  if (parsed.protocol === "wss:") {
    parsed.protocol = "https:";
  }

  parsed.pathname = "";
  parsed.search = "";
  parsed.hash = "";

  return parsed.toString().replace(/\/$/, "");
}

export async function GET() {
  const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL ?? DEFAULT_GATEWAY_URL;
  const target = `${toHttpBaseUrl(gatewayUrl)}/__openclaw/control-ui-config.json`;

  try {
    const response = await fetch(target, { cache: "no-store" });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Gateway config request failed (${response.status})` },
        { status: response.status }
      );
    }

    const payload = (await response.json()) as unknown;
    return NextResponse.json(payload, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Unable to reach gateway config endpoint" },
      { status: 502 }
    );
  }
}
