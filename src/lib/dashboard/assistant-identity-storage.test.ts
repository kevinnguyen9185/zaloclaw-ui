import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ASSISTANT_IDENTITY_STORAGE_KEY,
  loadAssistantIdentityState,
  saveAssistantIdentityState,
} from "@/lib/dashboard/assistant-identity-storage";

describe("assistant identity storage", () => {
  beforeEach(() => {
    const backing = new Map<string, string>();

    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => backing.get(key) ?? null,
        setItem: (key: string, value: string) => {
          backing.set(key, value);
        },
        removeItem: (key: string) => {
          backing.delete(key);
        },
      },
    });
  });

  it("persists and restores assistant identity state", () => {
    saveAssistantIdentityState({
      profile: {
        assistantName: "Miso",
        creatureType: "ghost",
        vibe: "warm",
        emoji: "👻",
        userName: "Hung",
        timezone: "Asia/Ho_Chi_Minh",
      },
      documents: {
        agent: "agent",
        soul: "soul",
        user: "user",
      },
    });

    expect(loadAssistantIdentityState()).toEqual({
      profile: {
        assistantName: "Miso",
        creatureType: "ghost",
        vibe: "warm",
        emoji: "👻",
        userName: "Hung",
        timezone: "Asia/Ho_Chi_Minh",
      },
      documents: {
        agent: "agent",
        soul: "soul",
        user: "user",
      },
    });
  });

  it("falls back on invalid storage payload", () => {
    window.localStorage.setItem(ASSISTANT_IDENTITY_STORAGE_KEY, "not-json");

    expect(loadAssistantIdentityState()).toEqual({
      profile: {
        assistantName: "",
        creatureType: "",
        vibe: "",
        emoji: "",
        userName: "",
        timezone: "",
      },
      documents: null,
    });
  });
});