import { describe, expect, it } from "vitest";

import { isZaloConnectedFromChannelsStatus } from "./zalo-status";

describe("isZaloConnectedFromChannelsStatus", () => {
  it("returns false when account probe exists and is not ok", () => {
    const payload = {
      channelAccounts: {
        zalo: [
          {
            accountId: "default",
            enabled: true,
            configured: true,
            running: true,
            probe: {
              ok: false,
              error: "Unauthorized",
            },
          },
        ],
      },
    };

    expect(isZaloConnectedFromChannelsStatus(payload)).toBe(false);
  });

  it("returns true when account probe exists and is ok", () => {
    const payload = {
      channelAccounts: {
        zalo: [
          {
            accountId: "default",
            enabled: true,
            configured: true,
            running: false,
            probe: {
              ok: true,
            },
          },
        ],
      },
    };

    expect(isZaloConnectedFromChannelsStatus(payload)).toBe(true);
  });

  it("falls back to running/connected only when probe is missing", () => {
    const payload = {
      channelAccounts: {
        zalo: [
          {
            accountId: "default",
            enabled: true,
            configured: true,
            running: true,
          },
        ],
      },
    };

    expect(isZaloConnectedFromChannelsStatus(payload)).toBe(true);
  });

  it("returns false when not configured", () => {
    const payload = {
      channelAccounts: {
        zalo: [
          {
            accountId: "default",
            enabled: true,
            configured: false,
            running: true,
            probe: {
              ok: true,
            },
          },
        ],
      },
    };

    expect(isZaloConnectedFromChannelsStatus(payload)).toBe(false);
  });
});
