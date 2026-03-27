"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DASHBOARD_USE_CASES,
  splitUseCasesForDashboard,
} from "@/lib/dashboard/use-cases";
import { useLocalization } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

import { UseCaseCard } from "./UseCaseCard";

export function UseCaseLaunchpad() {
  const { t } = useLocalization();
  const { featured, standard, hiddenCount } = splitUseCasesForDashboard(
    DASHBOARD_USE_CASES,
    4
  );

  if (!featured) {
    return (
      <Card className="animate-card-enter-3 border border-dashed border-border/80 bg-card/70">
        <CardHeader>
          <CardTitle className="text-base">{t("dashboard.launchpad.title")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{t("dashboard.launchpad.empty")}</p>
          <div>
            <Link href="/settings" className={buttonVariants({ variant: "outline", size: "sm" })}>
              {t("dashboard.launchpad.goSettings")}
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-4 animate-card-enter-3" aria-labelledby="use-cases-heading">
      <header className="space-y-1">
        <h2 id="use-cases-heading" className="font-heading text-xl font-semibold">
          {t("dashboard.launchpad.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("dashboard.launchpad.subtitle")}
        </p>
      </header>

      <UseCaseCard item={featured} featured />

      {standard.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-3">
          {standard.map((item) => (
            <UseCaseCard key={item.id} item={item} />
          ))}
        </div>
      ) : null}

      {hiddenCount > 0 ? (
        <div>
          <Link
            href="/settings?tab=use-cases"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "px-0")}
          >
            {t("dashboard.launchpad.viewAll").replace("{count}", String(hiddenCount))}
          </Link>
        </div>
      ) : null}
    </section>
  );
}
