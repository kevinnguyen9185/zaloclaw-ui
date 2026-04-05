export type AssistantIdentityProfile = {
  assistantName: string;
  creatureType: string;
  vibe: string;
  emoji: string;
  userName: string;
  timezone: string;
};

export type AssistantIdentityDocuments = {
  agent: string;
  soul: string;
  user: string;
};

export type AssistantIdentityState = {
  profile: AssistantIdentityProfile;
  documents: AssistantIdentityDocuments | null;
};

export type AssistantIdentityStage = "intro" | "questions";

export type AssistantIdentityValidationErrors = Partial<
  Record<keyof AssistantIdentityProfile, string>
>;

export const EMPTY_ASSISTANT_IDENTITY_PROFILE: AssistantIdentityProfile = {
  assistantName: "",
  creatureType: "",
  vibe: "",
  emoji: "",
  userName: "",
  timezone: "",
};

const REQUIRED_IDENTITY_FIELDS: Array<keyof AssistantIdentityProfile> = [
  "assistantName",
  "creatureType",
  "vibe",
  "emoji",
  "userName",
  "timezone",
];

function trimValue(value: string): string {
  return value.trim();
}

export function normalizeAssistantIdentityProfile(
  profile: AssistantIdentityProfile
): AssistantIdentityProfile {
  return {
    assistantName: trimValue(profile.assistantName),
    creatureType: trimValue(profile.creatureType),
    vibe: trimValue(profile.vibe),
    emoji: trimValue(profile.emoji),
    userName: trimValue(profile.userName),
    timezone: trimValue(profile.timezone),
  };
}

export function validateAssistantIdentityProfile(
  profile: AssistantIdentityProfile
): AssistantIdentityValidationErrors {
  const normalized = normalizeAssistantIdentityProfile(profile);
  const errors: AssistantIdentityValidationErrors = {};

  REQUIRED_IDENTITY_FIELDS.forEach((field) => {
    if (!normalized[field]) {
      errors[field] = "required";
    }
  });

  return errors;
}

export function hasCompletedAssistantIdentityProfile(
  profile: AssistantIdentityProfile
): boolean {
  return Object.keys(validateAssistantIdentityProfile(profile)).length === 0;
}

export function createStarterAssistantIdentity(
  partial: Partial<AssistantIdentityProfile> = {},
  fallbackTimezone = "UTC"
): AssistantIdentityProfile {
  return normalizeAssistantIdentityProfile({
    assistantName: partial.assistantName ?? "Miso",
    creatureType: partial.creatureType ?? "friendly ghost librarian",
    vibe: partial.vibe ?? "warm, curious, calm, and a little playful",
    emoji: partial.emoji ?? "📚",
    userName: partial.userName ?? "friend",
    timezone: partial.timezone ?? fallbackTimezone,
  });
}

export function createInitialAssistantIdentityStage(
  profile: AssistantIdentityProfile
): AssistantIdentityStage {
  return hasCompletedAssistantIdentityProfile(profile) ? "questions" : "intro";
}

export function startAssistantIdentityFlow(): AssistantIdentityStage {
  return "questions";
}

export function generateAssistantIdentityDocuments(
  profile: AssistantIdentityProfile
): AssistantIdentityDocuments {
  const normalized = normalizeAssistantIdentityProfile(profile);

  return {
    agent: [
      "# AGENT",
      "",
      "## Identity",
      `- Name: ${normalized.assistantName}`,
      `- Creature Type: ${normalized.creatureType}`,
      `- Emoji: ${normalized.emoji}`,
      "",
      "## Role",
      `${normalized.assistantName} is a ${normalized.creatureType} assistant for ${normalized.userName}.`,
      "",
      "## Operating Guidance",
      `- Keep a ${normalized.vibe} vibe in every response.`,
      `- Address the user as ${normalized.userName}.`,
      `- Use ${normalized.timezone} as the default timezone context when time matters.`,
      "- Stay helpful, grounded, and clear.",
      "",
    ].join("\n"),
    soul: [
      "# SOUL",
      "",
      "## Essence",
      `${normalized.assistantName} feels like a ${normalized.creatureType} with a ${normalized.vibe} presence ${normalized.emoji}.`,
      "",
      "## Voice",
      `- Emotional texture: ${normalized.vibe}`,
      `- Signature symbol: ${normalized.emoji}`,
      "- Default tone: approachable, thoughtful, and kind.",
      "",
      "## Relationship",
      `${normalized.assistantName} exists to support ${normalized.userName} with steady, human-friendly help.`,
      "",
    ].join("\n"),
    user: [
      "# USER",
      "",
      "## Identity",
      `- Name: ${normalized.userName}`,
      `- Timezone: ${normalized.timezone}`,
      "",
      "## Interaction Notes",
      `- Refer to the user as ${normalized.userName}.`,
      `- Assume local time context follows ${normalized.timezone}.`,
      `- The user chose ${normalized.assistantName} as their ${normalized.creatureType} assistant.`,
      "",
    ].join("\n"),
  };
}