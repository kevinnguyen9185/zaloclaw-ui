import { NextResponse } from "next/server";

import { stopTerminalSession } from "@/lib/gateway/gog-terminal-sessions";

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId")?.trim() ?? "";

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
  }

  if (!stopTerminalSession(sessionId)) {
    return NextResponse.json({ ok: false, error: "Session not found or expired." }, { status: 404 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
