"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { MoonIcon, SunIcon } from "lucide-react";

import { GatewayStatusBadge } from "@/components/dashboard/GatewayStatusBadge";
import { RecoveryDialog } from "@/components/status/RecoveryDialog";
import { StatusBar } from "@/components/status/StatusBar";
import { Button } from "@/components/ui/button";
import { DashboardChatProvider, useDashboardChat } from "@/lib/dashboard/chat";
import { getDashboardRouteFromPath } from "@/lib/dashboard/chat-events";
import { useLocalization } from "@/lib/i18n/context";
import { loadOnboardingState } from "@/lib/onboarding/storage";
import { useConnectionStatus } from "@/lib/status/context";
import { useTheme } from "@/lib/theme/context";
import { cn } from "@/lib/utils";

type NavigationItem = {
  href: string;
  labelKey: string;
  submenu?: Array<{
    id: string;
    labelKey: string;
    sectionId: string;
  }>;
};

const NAV_ITEMS: NavigationItem[] = [
  {
    href: "/dashboard",
    labelKey: "dashboard.nav.dashboard",
    submenu: [
      {
        id: "nav-use-cases",
        labelKey: "dashboard.nav.useCases",
        sectionId: "section-use-cases",
      },
      {
        id: "nav-agent-skills",
        labelKey: "dashboard.nav.agentSkills",
        sectionId: "section-agent-skills",
      },
      {
        id: "nav-running-jobs",
        labelKey: "dashboard.nav.runningJobs",
        sectionId: "section-running-jobs",
      },
      {
        id: "nav-operator-command",
        labelKey: "dashboard.nav.operatorCommand",
        sectionId: "section-operator-command",
      },
    ],
  },
  { href: "/settings", labelKey: "dashboard.nav.settings" },
];


const PAGE_TITLES: Record<string, { titleKey: string; subKey: string }> = {
  "/dashboard": {
    titleKey: "dashboard.page.dashboard.title",
    subKey: "dashboard.page.dashboard.sub",
  },
  "/settings": {
    titleKey: "dashboard.page.settings.title",
    subKey: "dashboard.page.settings.sub",
  },
};

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardChatProvider>
      <DashboardShell>{children}</DashboardShell>
    </DashboardChatProvider>
  );
}

function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const { resolvedMode, toggleMode } = useTheme();
  const { t } = useLocalization();
  const {
    layoutMode,
    publishEvent,
  } = useDashboardChat();
  const { recoveryService, dismissRecovery, checkNow } = useConnectionStatus();

  useEffect(() => {
    const state = loadOnboardingState();
    if (!state.completed) {
      router.replace("/");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return <div className="p-6 text-sm text-muted-foreground">{t("common.loading")}</div>;
  }

  const page = PAGE_TITLES[pathname] ?? {
    titleKey: "dashboard.page.dashboard.title",
    subKey: "",
  };
  const isChatFocused = layoutMode === "chat-focused";

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col border-r border-border bg-sidebar">
        {/* Brand strip */}
        <div className="relative h-28 w-full overflow-hidden">
          <Image
            src="/zaloclaw-design.png"
            alt="ZaloClaw"
            fill
            priority
            className="object-cover"
            style={{ objectPosition: "center 38%" }}
            sizes="224px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-sidebar via-sidebar/20 to-transparent" />
        </div>

        {/* Nav */}
        <nav className="flex flex-col px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className={
                    isActive
                      ? "flex items-center rounded-md border-l-2 border-primary bg-primary/10 px-3 py-2 text-sm font-medium text-primary"
                      : "flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  }
                >
                  {t(item.labelKey)}
                </Link>

                {/* Submenu */}
                {hasSubmenu && isActive && (
                  <div className="mt-1 flex flex-col gap-0.5 pl-2">
                    {(item.submenu ?? []).map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          const element = document.getElementById(sub.sectionId);
                          if (element) {
                            element.scrollIntoView({ behavior: "smooth", block: "start" });
                          }
                        }}
                        className="flex items-center rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        {t(sub.labelKey)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
          <div>
            <h2 className="text-sm font-semibold">{t(page.titleKey)}</h2>
            {page.subKey && (
              <p className="text-xs text-muted-foreground">{t(page.subKey)}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              aria-label={t("settings.theme.mode")}
              onClick={() => {
                toggleMode();
                publishEvent({
                  type: "action-triggered",
                  route: getDashboardRouteFromPath(pathname) ?? "dashboard",
                  action: "theme.toggle",
                });
              }}
            >
              {resolvedMode === "dark" ? (
                <MoonIcon className="h-4 w-4" />
              ) : (
                <SunIcon className="h-4 w-4" />
              )}
            </Button>
            <GatewayStatusBadge />
            <StatusBar />
          </div>
        </header>
        <div className="flex-1 bg-muted/30 p-4 sm:p-6">
          <div
            className={cn(
              "grid items-start gap-4",
              "xl:grid-cols-[minmax(0,1fr)]",
              isChatFocused ? "xl:grid-cols-[minmax(0,1fr)]" : ""
            )}
          >
            <div>{children}</div>
          </div>
        </div>
      </main>
      <RecoveryDialog
        service={recoveryService}
        onDismiss={dismissRecovery}
        onRetry={checkNow}
      />
    </div>
  );
}

