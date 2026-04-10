const MAX_COMMAND_LENGTH = 512;
const UNSAFE_TOKEN_PATTERN = /[;&|`$<>\n\r]/;
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

export const GOG_CREDENTIALS_PATH = "/home/node/.openclaw/credential.json";
export const FILE_CHECK_SENTINEL = "__file_check__";

export const FILE_CHECK_COMMAND = [
  "sh",
  "-c",
  `test -f ${GOG_CREDENTIALS_PATH} && echo present || echo missing`,
] as const;

export type ParsedGogCommand = {
  tokens: string[];
  normalizedCommand: string;
  interactive: boolean;
};

function stripQuotes(value: string): string {
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return value.slice(1, -1);
    }
  }

  return value;
}

export function readCommand(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function tokenizeCommand(command: string): string[] {
  if (!command) {
    throw new Error("Command is required.");
  }

  if (command.length > MAX_COMMAND_LENGTH) {
    throw new Error("Command is too long.");
  }

  if (UNSAFE_TOKEN_PATTERN.test(command)) {
    throw new Error("Command contains unsafe characters.");
  }

  const parts = command.split(/\s+/).filter((part) => part.length > 0);
  if (parts.length === 0) {
    throw new Error("Command is required.");
  }

  return parts;
}

export function parseNonInteractiveGogCommand(command: string): ParsedGogCommand {
  if (command === FILE_CHECK_SENTINEL) {
    return {
      tokens: [...FILE_CHECK_COMMAND],
      normalizedCommand: FILE_CHECK_SENTINEL,
      interactive: false,
    };
  }

  const parts = tokenizeCommand(command);

  if (
    parts.length === 4 &&
    parts[0] === "gog" &&
    parts[1] === "auth" &&
    parts[2] === "credentials" &&
    parts[3] === GOG_CREDENTIALS_PATH
  ) {
    return {
      tokens: parts,
      normalizedCommand: parts.join(" "),
      interactive: false,
    };
  }

  if (parts.length === 4 && parts[0] === "gog" && parts[1] === "gmail" && parts[2] === "search") {
    const query = stripQuotes(parts[3]);
    if (query === "is:unread") {
      return {
        tokens: ["gog", "gmail", "search", "is:unread"],
        normalizedCommand: 'gog gmail search "is:unread"',
        interactive: false,
      };
    }
  }

  throw new Error("Command is not allowed.");
}

export function parseTerminalGogCommand(command: string): ParsedGogCommand {
  const nonInteractive = parseNonInteractiveGogCommand(command);
  if (nonInteractive.normalizedCommand !== FILE_CHECK_SENTINEL) {
    return nonInteractive;
  }

  throw new Error("Command is not allowed in terminal mode.");
}

export function parseInteractiveAuthAddCommand(command: string): ParsedGogCommand {
  const parts = tokenizeCommand(command);
  if (
    parts.length === 5 &&
    parts[0] === "gog" &&
    parts[1] === "auth" &&
    parts[2] === "add" &&
    parts[4] === "--manual"
  ) {
    const email = stripQuotes(parts[3]);
    if (!EMAIL_PATTERN.test(email)) {
      throw new Error("Email is invalid.");
    }

    return {
      tokens: ["gog", "auth", "add", email, "--manual"],
      normalizedCommand: `gog auth add ${email} --manual`,
      interactive: true,
    };
  }

  throw new Error("Command is not allowed.");
}

export function parseTerminalAllowedCommand(command: string): ParsedGogCommand {
  try {
    return parseNonInteractiveGogCommand(command);
  } catch {
    return parseInteractiveAuthAddCommand(command);
  }
}
