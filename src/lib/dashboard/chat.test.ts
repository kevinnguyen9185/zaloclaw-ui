import { describe, expect, it } from "vitest";

import { reduceDashboardLayoutState, type DashboardLayoutState } from "@/lib/dashboard/chat";

describe("dashboard layout state", () => {
  const initialState: DashboardLayoutState = {
    mode: "balanced",
    isConfigurationCollapsed: false,
  };

  it("switches to chat-focused mode and collapses configuration", () => {
    const next = reduceDashboardLayoutState(initialState, { type: "focus-chat" });

    expect(next).toEqual({
      mode: "chat-focused",
      isConfigurationCollapsed: true,
    });
  });

  it("reopens configuration and restores balanced mode", () => {
    const focused: DashboardLayoutState = {
      mode: "chat-focused",
      isConfigurationCollapsed: true,
    };

    const next = reduceDashboardLayoutState(focused, { type: "reopen-configuration" });

    expect(next).toEqual({
      mode: "balanced",
      isConfigurationCollapsed: false,
    });
  });

  it("keeps collapsed state when mode is set to chat-focused", () => {
    const focused: DashboardLayoutState = {
      mode: "chat-focused",
      isConfigurationCollapsed: true,
    };

    const next = reduceDashboardLayoutState(focused, {
      type: "set-mode",
      mode: "chat-focused",
    });

    expect(next).toEqual(focused);
  });

  it("resets to balanced defaults", () => {
    const focused: DashboardLayoutState = {
      mode: "chat-focused",
      isConfigurationCollapsed: true,
    };

    const next = reduceDashboardLayoutState(focused, { type: "reset" });

    expect(next).toEqual(initialState);
  });
});
