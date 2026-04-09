import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { randomUUID } from "node:crypto";

import { getContainerName } from "@/lib/gateway/gog-command";

export type TerminalEvent =
  | { type: "stdout"; chunk: string }
  | { type: "stderr"; chunk: string }
  | { type: "done"; exitCode: number | null }
  | { type: "timeout" };

type EventListener = (event: TerminalEvent) => void;

type ActiveSession = {
  id: string;
  command: string;
  child: ChildProcessWithoutNullStreams;
  createdAt: number;
  closed: boolean;
  buffer: TerminalEvent[];
  listeners: Set<EventListener>;
  hardTimeout: ReturnType<typeof setTimeout>;
  cleanupTimer: ReturnType<typeof setTimeout> | null;
};

const SESSION_TTL_MS = 10 * 60_000;
const FINISHED_SESSION_GRACE_MS = 30_000;

const sessions = new Map<string, ActiveSession>();

function scheduleCleanup(session: ActiveSession) {
  if (session.cleanupTimer) {
    return;
  }

  session.cleanupTimer = setTimeout(() => {
    sessions.delete(session.id);
  }, FINISHED_SESSION_GRACE_MS);
}

function emit(session: ActiveSession, event: TerminalEvent) {
  session.buffer.push(event);
  if (session.buffer.length > 200) {
    session.buffer.shift();
  }

  for (const listener of session.listeners) {
    listener(event);
  }
}

function finalizeSession(session: ActiveSession, event: TerminalEvent) {
  if (session.closed) {
    return;
  }

  session.closed = true;
  clearTimeout(session.hardTimeout);
  emit(session, event);
  scheduleCleanup(session);
}

export function startTerminalSession(command: string, tokens: string[]): { sessionId: string } {
  const containerName = getContainerName();
  const args = ["exec", "-i", "--user", "node", containerName, ...tokens];

  const child = spawn("docker", args, {
    stdio: ["pipe", "pipe", "pipe"],
  });

  const sessionId = randomUUID();
  const session: ActiveSession = {
    id: sessionId,
    command,
    child,
    createdAt: Date.now(),
    closed: false,
    buffer: [],
    listeners: new Set<EventListener>(),
    hardTimeout: setTimeout(() => {
      child.kill("SIGTERM");
      finalizeSession(session, { type: "timeout" });
    }, SESSION_TTL_MS),
    cleanupTimer: null,
  };

  child.stdout.on("data", (chunk: Buffer | string) => {
    emit(session, { type: "stdout", chunk: chunk.toString() });
  });

  child.stderr.on("data", (chunk: Buffer | string) => {
    emit(session, { type: "stderr", chunk: chunk.toString() });
  });

  child.on("error", (error) => {
    emit(session, { type: "stderr", chunk: `${error.message}\n` });
    finalizeSession(session, { type: "done", exitCode: null });
  });

  child.on("close", (code) => {
    finalizeSession(session, { type: "done", exitCode: code });
  });

  sessions.set(sessionId, session);
  return { sessionId };
}

export function getTerminalSessionSnapshot(sessionId: string): {
  command: string;
  createdAt: number;
  closed: boolean;
  buffer: TerminalEvent[];
} | null {
  const session = sessions.get(sessionId);
  if (!session) {
    return null;
  }

  return {
    command: session.command,
    createdAt: session.createdAt,
    closed: session.closed,
    buffer: [...session.buffer],
  };
}

export function subscribeTerminalSession(
  sessionId: string,
  listener: EventListener
): (() => void) | null {
  const session = sessions.get(sessionId);
  if (!session) {
    return null;
  }

  session.listeners.add(listener);
  return () => {
    session.listeners.delete(listener);
  };
}

export function sendTerminalSessionInput(sessionId: string, input: string): boolean {
  const session = sessions.get(sessionId);
  if (!session || session.closed || session.child.killed) {
    return false;
  }

  session.child.stdin.write(`${input}\n`);
  return true;
}

export function stopTerminalSession(sessionId: string): boolean {
  const session = sessions.get(sessionId);
  if (!session) {
    return false;
  }

  if (!session.closed) {
    session.child.kill("SIGTERM");
    finalizeSession(session, { type: "done", exitCode: null });
  }

  return true;
}
