import { NextResponse } from "next/server";

import { parseTerminalAllowedCommand, readCommand } from "@/lib/gateway/gog-command";
import {
  getTerminalSessionSnapshot,
  startTerminalSession,
  subscribeTerminalSession,
} from "@/lib/gateway/gog-terminal-sessions";

type TerminalStartRequest = {
  command?: unknown;
};

const encoder = new TextEncoder();

function sseEvent(type: string, payload: unknown): Uint8Array {
  return encoder.encode(`event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`);
}

export async function POST(request: Request) {
  let body: TerminalStartRequest;

  try {
    body = (await request.json()) as TerminalStartRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const command = readCommand(body.command);
  if (!command) {
    return NextResponse.json({ error: "Command is required." }, { status: 400 });
  }

  try {
    const parsed = parseTerminalAllowedCommand(command);
    const { sessionId } = startTerminalSession(parsed.normalizedCommand, parsed.tokens);
    return NextResponse.json({ sessionId }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start terminal session.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId")?.trim() ?? "";
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
  }

  const snapshot = getTerminalSessionSnapshot(sessionId);
  if (!snapshot) {
    return NextResponse.json({ error: "Session not found or expired." }, { status: 404 });
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(sseEvent("session", { sessionId, command: snapshot.command }));
      for (const event of snapshot.buffer) {
        controller.enqueue(sseEvent(event.type, event));
      }

      if (snapshot.closed) {
        controller.close();
        return;
      }

      const unsubscribe = subscribeTerminalSession(sessionId, (event) => {
        controller.enqueue(sseEvent(event.type, event));
        if (event.type === "done" || event.type === "timeout") {
          unsubscribe?.();
          controller.close();
        }
      });

      if (!unsubscribe) {
        controller.enqueue(sseEvent("stderr", { chunk: "Session not found or expired." }));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
