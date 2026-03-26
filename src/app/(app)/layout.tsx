"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { MoonIcon, SunIcon } from "lucide-react";

import { GatewayStatusBadge } from "@/components/dashboard/GatewayStatusBadge";
import { Button, buttonVariants } from "@/components/ui/button";
import { loadOnboardingState } from "@/lib/onboarding/storage";
import { useTheme } from "@/lib/theme/context";

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const { resolvedMode, toggleMode } = useTheme();

  useEffect(() => {
    const state = loadOnboardingState();
    if (!state.completed) {
      router.replace("/");
      return;
    }

    setReady(true);
  }, [router]);

  if (!ready) {
    return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="w-56 border-r border-border bg-card p-4">
        <h1 className="mb-4 text-lg font-semibold">Zalo Claw UI</h1>
        <nav className="flex flex-col gap-2">
          <Link
            href="/dashboard"
            className={buttonVariants({
              variant: pathname === "/dashboard" ? "default" : "ghost",
            })}
          >
            Dashboard
          </Link>
          <Link
            href="/settings"
            className={buttonVariants({
              variant: pathname === "/settings" ? "default" : "ghost",
            })}
          >
            Settings
          </Link>
        </nav>
      </aside>

      <main className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <h2 className="text-base font-medium">Assistant Dashboard</h2>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              aria-label="Toggle theme mode"
              onClick={toggleMode}
            >
              {resolvedMode === "dark" ? (
                <MoonIcon className="h-4 w-4" />
              ) : (
                <SunIcon className="h-4 w-4" />
              )}
            </Button>
            <GatewayStatusBadge />
          </div>
        </header>
        <div className="flex-1 p-6">{children}</div>
      </main>
    </div>
  );
}
