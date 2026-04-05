export type DashboardChatEventType =
  | "action-triggered"
  | "save-succeeded"
  | "save-failed";

export type DashboardChatRoute = "dashboard" | "settings";

export type DashboardChatEvent = {
  type: DashboardChatEventType;
  route?: DashboardChatRoute;
  action?: string;
  message?: string;
  at?: number;
};

const ROUTE_LABEL: Record<DashboardChatRoute, string> = {
  dashboard: "Dashboard",
  settings: "Settings",
};

export function getDashboardRouteFromPath(pathname: string): DashboardChatRoute | null {
  if (pathname.startsWith("/dashboard")) {
    return "dashboard";
  }

  if (pathname.startsWith("/settings")) {
    return "settings";
  }

  return null;
}

export function createDashboardChatEventKey(event: DashboardChatEvent): string {
  return [event.type, event.route ?? "", event.action ?? ""].join("|");
}

export function shouldCoalesceDashboardChatEvent(
  previous: DashboardChatEvent | null,
  next: DashboardChatEvent,
  windowMs = 1200
): boolean {
  if (!previous) {
    return false;
  }

  const previousAt = previous.at ?? 0;
  const nextAt = next.at ?? 0;
  if (nextAt - previousAt > windowMs) {
    return false;
  }

  return createDashboardChatEventKey(previous) === createDashboardChatEventKey(next);
}

export function formatDashboardChatEventMessage(event: DashboardChatEvent): string {
  const routeLabel = event.route ? ROUTE_LABEL[event.route] : "Dashboard";

  if (event.type === "action-triggered") {
    return `${routeLabel}: triggered ${event.action ?? "an action"}.`;
  }

  if (event.type === "save-succeeded") {
    return `${routeLabel}: ${event.action ?? "action"} completed successfully.`;
  }

  return `${routeLabel}: ${event.action ?? "action"} failed${event.message ? ` (${event.message})` : ""}.`;
}
