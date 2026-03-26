"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { GatewayStatusBadge } from "@/components/dashboard/GatewayStatusBadge";
import { buttonVariants } from "@/components/ui/button";
import { loadOnboardingState } from "@/lib/onboarding/storage";

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

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
    <div className="flex min-h-screen bg-zinc-50">
      <aside className="w-56 border-r bg-white p-4">
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
        <header className="flex items-center justify-between border-b bg-white px-6 py-4">
          <h2 className="text-base font-medium">Assistant Dashboard</h2>
          <GatewayStatusBadge />
        </header>
        <div className="flex-1 p-6">{children}</div>
      </main>
    </div>
  );
}
