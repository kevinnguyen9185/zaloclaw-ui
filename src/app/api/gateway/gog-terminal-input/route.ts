import { NextResponse } from "next/server";

import { sendTerminalSessionInput } from "@/lib/gateway/gog-terminal-sessions";

type TerminalInputRequest = {
  sessionId?: unknown;
  input?: unknown;
};

export async function POST(request: Request) {
  let body: TerminalInputRequest;

  try {
    body = (await request.json()) as TerminalInputRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
  }

  const input = typeof body.input === "string" ? body.input : "";

  if (!sendTerminalSessionInput(sessionId, input)) {
    return NextResponse.json({ ok: false, error: "Session not found or expired." }, { status: 404 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
