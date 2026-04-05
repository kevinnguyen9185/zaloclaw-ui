import { describe, expect, it } from "vitest";

import {
  createDashboardChatEventKey,
  formatDashboardChatEventMessage,
  getDashboardRouteFromPath,
  shouldCoalesceDashboardChatEvent,
} from "@/lib/dashboard/chat-events";

describe("dashboard chat events", () => {
  it("maps dashboard routes from pathname", () => {
    expect(getDashboardRouteFromPath("/dashboard")).toBe("dashboard");
    expect(getDashboardRouteFromPath("/settings")).toBe("settings");
    expect(getDashboardRouteFromPath("/check")).toBeNull();
  });

  it("creates stable event keys", () => {
    expect(
      createDashboardChatEventKey({
        type: "action-triggered",
        route: "dashboard",
        action: "theme.toggle",
      })
    ).toBe("action-triggered|dashboard|theme.toggle");
  });

  it("coalesces duplicate route events in a short window", () => {
    const previous = {
      type: "action-triggered" as const,
      route: "dashboard" as const,
      action: "theme.toggle",
      at: 100,
    };

    const duplicate = {
      type: "action-triggered" as const,
      route: "dashboard" as const,
      action: "theme.toggle",
      at: 250,
    };

    const later = {
      type: "action-triggered" as const,
      route: "dashboard" as const,
      action: "theme.toggle",
      at: 1800,
    };

    expect(shouldCoalesceDashboardChatEvent(previous, duplicate, 1200)).toBe(true);
    expect(shouldCoalesceDashboardChatEvent(previous, later, 1200)).toBe(false);
  });

  it("formats failure context messages", () => {
    expect(
      formatDashboardChatEventMessage({
        type: "save-failed",
        route: "dashboard",
        action: "identity.generateFiles",
        message: "Gateway unavailable",
      })
    ).toBe("Dashboard: identity.generateFiles failed (Gateway unavailable).");
  });

});
