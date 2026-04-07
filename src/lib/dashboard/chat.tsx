"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { type DashboardChatEvent } from "@/lib/dashboard/chat-events";
import {
  type DashboardJob,
  normalizeDashboardJobs,
  upsertDashboardJob,
} from "@/lib/dashboard/jobs";
import { loadAssistantIdentityState } from "@/lib/dashboard/assistant-identity-storage";
import { useGateway } from "@/lib/gateway/context";
import type { JsonValue } from "@/lib/gateway/types";

type DashboardIdentityProfile = {
  assistantName: string;
  creatureType: string;
  vibe: string;
  emoji: string;
  userName: string;
  timezone: string;
};

type DashboardChatRole = "assistant" | "user";

export type DashboardLayoutMode = "balanced" | "chat-focused";

export type DashboardLayoutState = {
  mode: DashboardLayoutMode;
  isConfigurationCollapsed: boolean;
};

export type DashboardLayoutAction =
  | { type: "focus-chat" }
  | { type: "restore-balanced" }
  | { type: "set-mode"; mode: DashboardLayoutMode }
  | { type: "collapse-configuration" }
  | { type: "reopen-configuration" }
  | { type: "reset" };

const INITIAL_DASHBOARD_LAYOUT_STATE: DashboardLayoutState = {
  mode: "balanced",
  isConfigurationCollapsed: false,
};

export function reduceDashboardLayoutState(
  state: DashboardLayoutState,
  action: DashboardLayoutAction
): DashboardLayoutState {
  switch (action.type) {
    case "focus-chat":
      return {
        mode: "chat-focused",
        isConfigurationCollapsed: true,
      };
    case "restore-balanced":
      return {
        mode: "balanced",
        isConfigurationCollapsed: false,
      };
    case "set-mode":
      return action.mode === "chat-focused"
        ? {
            mode: "chat-focused",
            isConfigurationCollapsed: state.isConfigurationCollapsed,
          }
        : {
            mode: "balanced",
            isConfigurationCollapsed: false,
          };
    case "collapse-configuration":
      return {
        mode: "chat-focused",
        isConfigurationCollapsed: true,
      };
    case "reopen-configuration":
      return {
        mode: "balanced",
        isConfigurationCollapsed: false,
      };
    case "reset":
      return INITIAL_DASHBOARD_LAYOUT_STATE;
    default:
      return state;
  }
}

export type DashboardChatMessage = {
  id: string;
  role: DashboardChatRole;
  content: string;
  at: number;
};

type DashboardChatContextValue = {
  messages: DashboardChatMessage[];
  jobs: DashboardJob[];
  draft: string;
  setDraft: (value: string) => void;
  isResponding: boolean;
  isMobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
  layoutMode: DashboardLayoutMode;
  isConfigurationCollapsed: boolean;
  botName: string;
  setBotName: (value: string) => void;
  updateIdentityProfile: (profile: Partial<DashboardIdentityProfile>) => void;
  focusChatMode: () => void;
  reopenConfiguration: () => void;
  setLayoutMode: (mode: DashboardLayoutMode) => void;
  sendMessage: (value: string) => Promise<void>;
  startCommandJob: (command: string) => string;
  completeCommandJob: (
    jobId: string,
    outcome: {
      status: "done" | "failed";
      summary: string;
      runId?: string;
    }
  ) => void;
  publishEvent: (event: DashboardChatEvent) => void;
  resetSession: () => void;
};

type JsonRecord = Record<string, JsonValue | undefined>;
type EventSubscriber = (
  event: string,
  handler: (payload: JsonValue | undefined) => void
) => () => void;

const DEFAULT_BOT_NAME = "your Zalo bot";

const DEFAULT_DASHBOARD_IDENTITY_PROFILE: DashboardIdentityProfile = {
  assistantName: DEFAULT_BOT_NAME,
  creatureType: "assistant",
  vibe: "friendly and helpful",
  emoji: "",
  userName: "friend",
  timezone: "UTC",
};

function normalizeBotName(value: string): string {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : DEFAULT_BOT_NAME;
}

function readSavedBotName(): string {
  if (typeof window === "undefined") {
    return DEFAULT_BOT_NAME;
  }

  const stored = loadAssistantIdentityState();
  return normalizeBotName(stored.profile.assistantName);
}

function normalizeIdentityProfile(
  profile: Partial<DashboardIdentityProfile>
): DashboardIdentityProfile {
  return {
    assistantName: normalizeBotName(
      profile.assistantName ?? DEFAULT_DASHBOARD_IDENTITY_PROFILE.assistantName
    ),
    creatureType:
      profile.creatureType?.trim() || DEFAULT_DASHBOARD_IDENTITY_PROFILE.creatureType,
    vibe: profile.vibe?.trim() || DEFAULT_DASHBOARD_IDENTITY_PROFILE.vibe,
    emoji: profile.emoji?.trim() || DEFAULT_DASHBOARD_IDENTITY_PROFILE.emoji,
    userName: profile.userName?.trim() || DEFAULT_DASHBOARD_IDENTITY_PROFILE.userName,
    timezone: profile.timezone?.trim() || DEFAULT_DASHBOARD_IDENTITY_PROFILE.timezone,
  };
}

function readSavedIdentityProfile(): DashboardIdentityProfile {
  if (typeof window === "undefined") {
    return DEFAULT_DASHBOARD_IDENTITY_PROFILE;
  }

  const stored = loadAssistantIdentityState();
  return normalizeIdentityProfile(stored.profile);
}

function sanitizeAssistantReply(value: string): string {
  const normalized = value.replace(/\r\n?/g, "\n").trim();
  if (!normalized) {
    return normalized;
  }

  const halfLength = Math.floor(normalized.length / 2);
  if (
    normalized.length % 2 === 0 &&
    normalized.slice(0, halfLength) === normalized.slice(halfLength)
  ) {
    return normalized.slice(0, halfLength).trim();
  }

  const repeatedMatch = normalized.match(/^([\s\S]+?)\s*\1$/);
  if (repeatedMatch?.[1]) {
    return repeatedMatch[1].trim();
  }

  return normalized;
}

function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `dashboard-chat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readRunId(payload: JsonValue): string | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const record = payload as Record<string, unknown>;
  return typeof record.runId === "string" && record.runId.trim().length > 0
    ? record.runId.trim()
    : null;
}

function readRecord(payload: JsonValue): JsonRecord | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  return payload as JsonRecord;
}

function readString(record: JsonRecord | null, key: string): string | null {
  if (!record) {
    return null;
  }

  const value = record[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function extractChatMessageText(payload: JsonValue): string | null {
  const record = readRecord(payload);
  const message = readRecord((record?.message ?? null) as JsonValue);
  const content = message?.content;

  if (!Array.isArray(content)) {
    return null;
  }

  const text = content
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return "";
      }
      const recordItem = item as JsonRecord;
      return typeof recordItem.text === "string" ? recordItem.text : "";
    })
    .join("")
    .trim();

  return text.length > 0 ? text : null;
}

function waitForFinalAgentReply(
  runId: string,
  subscribeToEvent: EventSubscriber,
  timeoutMs: number
): Promise<string | null> {
  return new Promise((resolve) => {
    let settled = false;
    let latestText: string | null = null;

    const finish = (value: string | null) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeoutHandle);
      unsubscribeChat();
      unsubscribeAgent();
      resolve(value);
    };

    const unsubscribeChat = subscribeToEvent("chat", (payload) => {
      const record = readRecord((payload ?? null) as JsonValue);
      if (!record || readString(record, "runId") !== runId) {
        return;
      }

      const nextText = extractChatMessageText((payload ?? null) as JsonValue);
      if (nextText) {
        latestText = nextText;
      }

      if (readString(record, "state") === "final") {
        finish(latestText);
      }
    });

    const unsubscribeAgent = subscribeToEvent("agent", (payload) => {
      const record = readRecord((payload ?? null) as JsonValue);
      if (!record || readString(record, "runId") !== runId) {
        return;
      }

      const stream = readString(record, "stream");
      const data = readRecord((record.data ?? null) as JsonValue);

      if (stream === "assistant") {
        const text = readString(data, "text");
        if (text) {
          latestText = text;
        }
      }

      if (stream === "lifecycle") {
        const phase = readString(data, "phase");
        if (phase === "final" || phase === "end") {
          finish(latestText);
        }
      }
    });

    const timeoutHandle = setTimeout(() => {
      finish(latestText);
    }, timeoutMs);
  });
}

function createWelcomeMessage(id: string, profile: DashboardIdentityProfile): DashboardChatMessage {
  const emojiSuffix = profile.emoji ? ` ${profile.emoji}` : "";
  return {
    id,
    role: "assistant",
    content: `Hi, I am ${profile.assistantName}${emojiSuffix}. Ask me anything about your setup.`,
    at: Date.now(),
  };
}

function createJobTitle(source: DashboardJob["source"]): string {
  return source === "command" ? "Operator command" : "Agent execution";
}

function summarizeText(value: string, maxLength = 140): string {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 1)}...`;
}

const DashboardChatContext = createContext<DashboardChatContextValue | null>(null);

export function DashboardChatProvider({ children }: { children: ReactNode }) {
  const { status: gatewayStatus, send, subscribe } = useGateway();
  const [identityProfile, setIdentityProfile] = useState<DashboardIdentityProfile>(
    readSavedIdentityProfile
  );
  const [botName, setBotNameState] = useState<string>(readSavedBotName);
  const [messages, setMessages] = useState<DashboardChatMessage[]>([
    createWelcomeMessage("assistant-welcome", readSavedIdentityProfile()),
  ]);
  const [jobs, setJobs] = useState<DashboardJob[]>([]);
  const [draft, setDraft] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const [isMobileOpen, setMobileOpen] = useState(true);
  const [layoutState, setLayoutState] = useState<DashboardLayoutState>(
    INITIAL_DASHBOARD_LAYOUT_STATE
  );

  const messageCounterRef = useRef(0);
  const identityProfileRef = useRef<DashboardIdentityProfile>(identityProfile);
  identityProfileRef.current = identityProfile;

  const appendMessage = useCallback((role: DashboardChatRole, content: string) => {
    const at = Date.now();
    const id = `${role}-${at}-${messageCounterRef.current}`;
    messageCounterRef.current += 1;
    setMessages((prev) => [...prev, { id, role, content, at }]);
  }, []);

  const startCommandJob = useCallback((command: string) => {
    const now = Date.now();
    const id = `command-${now}-${messageCounterRef.current}`;

    setJobs((previous) =>
      normalizeDashboardJobs([
        {
          id,
          source: "command",
          title: createJobTitle("command"),
          status: "running",
          command,
          summary: summarizeText(command),
          startedAt: now,
          updatedAt: now,
        },
        ...previous,
      ])
    );

    return id;
  }, []);

  const completeCommandJob = useCallback(
    (
      jobId: string,
      outcome: {
        status: "done" | "failed";
        summary: string;
        runId?: string;
      }
    ) => {
      const now = Date.now();

      setJobs((previous) => {
        const existing = previous.find((job) => job.id === jobId);
        const next = upsertDashboardJob(previous, {
          id: jobId,
          source: "command",
          title: createJobTitle("command"),
          status: outcome.status,
          command: existing?.command,
          runId: outcome.runId,
          summary: summarizeText(outcome.summary),
          startedAt: existing?.startedAt ?? now,
          updatedAt: now,
          endedAt: now,
        });

        return normalizeDashboardJobs(next);
      });
    },
    []
  );

  const publishEvent = useCallback((event: DashboardChatEvent) => {
    void event;
  }, []);

  const sendMessage = useCallback(
    async (value: string) => {
      const normalized = value.trim();
      if (!normalized) {
        return;
      }

      appendMessage("user", normalized);
      setDraft("");

      if (gatewayStatus !== "connected") {
        appendMessage(
          "assistant",
          `${identityProfile.assistantName} is offline right now. Please reconnect gateway, then I can send this to the real agent.`
        );
        return;
      }

      setIsResponding(true);

      let activeRunId: string | null = null;

      try {
        const accepted = await send("agent", {
          message: normalized,
          idempotencyKey: createIdempotencyKey(),
          agentId: "main",
        });

        const runId = readRunId(accepted);
        if (!runId) {
          throw new Error("Agent accepted response did not include runId.");
        }

        activeRunId = runId;
        const now = Date.now();
        setJobs((previous) =>
          normalizeDashboardJobs(
            upsertDashboardJob(previous, {
              id: `agent-${runId}`,
              source: "agent",
              title: createJobTitle("agent"),
              runId,
              status: "running",
              summary: summarizeText(normalized),
              startedAt: now,
              updatedAt: now,
            })
          )
        );

        const streamedReply = await waitForFinalAgentReply(runId, subscribe, 120000);
        if (streamedReply) {
          appendMessage("assistant", sanitizeAssistantReply(streamedReply));
          const now = Date.now();
          setJobs((previous) =>
            normalizeDashboardJobs(
              upsertDashboardJob(previous, {
                id: `agent-${runId}`,
                source: "agent",
                title: createJobTitle("agent"),
                runId,
                status: "done",
                summary: summarizeText(streamedReply),
                startedAt: previous.find((job) => job.id === `agent-${runId}`)?.startedAt ?? now,
                updatedAt: now,
                endedAt: now,
              })
            )
          );
        } else {
          appendMessage(
            "assistant",
            `${identityProfile.assistantName}: Agent finished, but did not return a readable text response.`
          );

          const now = Date.now();
          setJobs((previous) =>
            normalizeDashboardJobs(
              upsertDashboardJob(previous, {
                id: `agent-${runId}`,
                source: "agent",
                title: createJobTitle("agent"),
                runId,
                status: "failed",
                summary: "Agent finished without readable response",
                startedAt: previous.find((job) => job.id === `agent-${runId}`)?.startedAt ?? now,
                updatedAt: now,
                endedAt: now,
              })
            )
          );
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unknown error while waiting for agent response.";
        appendMessage(
          "assistant",
          `${identityProfile.assistantName}: I could not get agent response yet (${message}).`
        );

        const now = Date.now();
        const fallbackId = activeRunId
          ? `agent-${activeRunId}`
          : `agent-error-${now}-${messageCounterRef.current}`;
        setJobs((previous) =>
          normalizeDashboardJobs(
            upsertDashboardJob(previous, {
              id: fallbackId,
              source: "agent",
              title: createJobTitle("agent"),
              runId: activeRunId ?? undefined,
              status: "failed",
              summary: summarizeText(message),
              startedAt: previous.find((job) => job.id === fallbackId)?.startedAt ?? now,
              updatedAt: now,
              endedAt: now,
            })
          )
        );
      } finally {
        setIsResponding(false);
      }
    },
    [appendMessage, gatewayStatus, identityProfile, send, subscribe]
  );

  const setBotName = useCallback((value: string) => {
    const normalized = normalizeBotName(value);
    setBotNameState(normalized);
    setIdentityProfile((current) => ({
      ...current,
      assistantName: normalized,
    }));
  }, []);

  const updateIdentityProfile = useCallback((profile: Partial<DashboardIdentityProfile>) => {
    const normalized = normalizeIdentityProfile({
      ...identityProfileRef.current,
      ...profile,
    });

    const previous = identityProfileRef.current;
    const unchanged =
      previous.assistantName === normalized.assistantName &&
      previous.creatureType === normalized.creatureType &&
      previous.vibe === normalized.vibe &&
      previous.emoji === normalized.emoji &&
      previous.userName === normalized.userName &&
      previous.timezone === normalized.timezone;

    if (unchanged) {
      return;
    }

    setIdentityProfile(normalized);
    setBotNameState(normalized.assistantName);
  }, []);

  const resetSession = useCallback(() => {
    setMessages([createWelcomeMessage("assistant-welcome-reset", identityProfile)]);
    setDraft("");
    setIsResponding(false);
    setJobs([]);
    setMobileOpen(true);
    setLayoutState(INITIAL_DASHBOARD_LAYOUT_STATE);
    messageCounterRef.current = 0;
  }, [identityProfile]);

  const focusChatMode = useCallback(() => {
    setLayoutState((current) =>
      reduceDashboardLayoutState(current, { type: "focus-chat" })
    );
    setMobileOpen(true);
  }, []);

  const reopenConfiguration = useCallback(() => {
    setLayoutState((current) =>
      reduceDashboardLayoutState(current, { type: "reopen-configuration" })
    );
  }, []);

  const setLayoutMode = useCallback((mode: DashboardLayoutMode) => {
    setLayoutState((current) =>
      reduceDashboardLayoutState(current, { type: "set-mode", mode })
    );
  }, []);

  const value = useMemo<DashboardChatContextValue>(
    () => ({
      messages,
      jobs,
      draft,
      setDraft,
      isResponding,
      isMobileOpen,
      setMobileOpen,
      layoutMode: layoutState.mode,
      isConfigurationCollapsed: layoutState.isConfigurationCollapsed,
      botName,
      setBotName,
      updateIdentityProfile,
      focusChatMode,
      reopenConfiguration,
      setLayoutMode,
      sendMessage,
      startCommandJob,
      completeCommandJob,
      publishEvent,
      resetSession,
    }),
    [
      messages,
      jobs,
      draft,
      isResponding,
      isMobileOpen,
      layoutState,
      botName,
      setBotName,
      updateIdentityProfile,
      focusChatMode,
      reopenConfiguration,
      setLayoutMode,
      sendMessage,
      startCommandJob,
      completeCommandJob,
      publishEvent,
      resetSession,
    ]
  );

  return (
    <DashboardChatContext.Provider value={value}>
      {children}
    </DashboardChatContext.Provider>
  );
}

export function useDashboardChat(): DashboardChatContextValue {
  const context = useContext(DashboardChatContext);
  if (!context) {
    throw new Error("useDashboardChat must be used within DashboardChatProvider");
  }

  return context;
}
