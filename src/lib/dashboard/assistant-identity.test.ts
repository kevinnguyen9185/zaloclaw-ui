import { describe, expect, it } from "vitest";

import {
  createInitialAssistantIdentityStage,
  createStarterAssistantIdentity,
  EMPTY_ASSISTANT_IDENTITY_PROFILE,
  generateAssistantIdentityDocuments,
  hasCompletedAssistantIdentityProfile,
  startAssistantIdentityFlow,
  validateAssistantIdentityProfile,
} from "@/lib/dashboard/assistant-identity";

describe("assistant identity helpers", () => {
  it("validates required identity fields", () => {
    expect(validateAssistantIdentityProfile(EMPTY_ASSISTANT_IDENTITY_PROFILE)).toEqual({
      assistantName: "required",
      creatureType: "required",
      vibe: "required",
      emoji: "required",
      userName: "required",
      timezone: "required",
    });
  });

  it("creates a starter identity and preserves provided values", () => {
    expect(
      createStarterAssistantIdentity({ userName: "Hung", timezone: "Asia/Ho_Chi_Minh" })
    ).toEqual({
      assistantName: "Miso",
      creatureType: "friendly ghost librarian",
      vibe: "warm, curious, calm, and a little playful",
      emoji: "📚",
      userName: "Hung",
      timezone: "Asia/Ho_Chi_Minh",
    });
  });

  it("generates OpenClaw identity documents from the profile", () => {
    const documents = generateAssistantIdentityDocuments({
      assistantName: "Miso",
      creatureType: "friendly ghost librarian",
      vibe: "warm and curious",
      emoji: "📚",
      userName: "Hung",
      timezone: "Asia/Ho_Chi_Minh",
    });

    expect(documents.agent).toContain("Name: Miso");
    expect(documents.soul).toContain("warm and curious");
    expect(documents.user).toContain("Timezone: Asia/Ho_Chi_Minh");
  });

  it("tracks intro and start transition state", () => {
    expect(createInitialAssistantIdentityStage(EMPTY_ASSISTANT_IDENTITY_PROFILE)).toBe(
      "intro"
    );
    expect(startAssistantIdentityFlow()).toBe("questions");
    expect(
      hasCompletedAssistantIdentityProfile(
        createStarterAssistantIdentity({ userName: "Hung", timezone: "Asia/Ho_Chi_Minh" })
      )
    ).toBe(true);
  });
});