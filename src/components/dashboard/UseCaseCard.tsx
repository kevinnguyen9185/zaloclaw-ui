"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { UseCaseEffort, UseCaseItem } from "@/lib/dashboard/use-cases";
import { useLocalization } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

const EFFORT_KEYS: Record<UseCaseEffort, string> = {
  quick: "dashboard.card.effort.quick",
  standard: "dashboard.card.effort.standard",
  advanced: "dashboard.card.effort.advanced",
};

type UseCaseCardProps = {
  item: UseCaseItem;
  featured?: boolean;
};

export function UseCaseCard({ item, featured = false }: UseCaseCardProps) {
  const { t } = useLocalization();
  const effortLabel = t(EFFORT_KEYS[item.effort]);

  return (
    <Card
      className={cn(
        "h-full border border-border/80 bg-card/90",
        featured && "border-primary/30 bg-primary/[0.06]"
      )}
    >
      <CardHeader className="gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {effortLabel}
          </span>
          {featured ? (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
              {t("dashboard.card.featured")}
            </span>
          ) : null}
        </div>
        <CardTitle className={cn("text-base", featured && "text-lg")}>{t(item.titleKey)}</CardTitle>
        <CardDescription className="text-sm leading-relaxed">{t(item.outcomeKey)}</CardDescription>
      </CardHeader>

      <CardContent>
        <ul className="flex flex-wrap gap-1.5" aria-label={t("dashboard.launchpad.title") + " tags"}>
          {item.tagKeys.map((tagKey) => (
            <li key={tagKey}>
              <span className="rounded-full border border-border/80 bg-muted/60 px-2 py-0.5 text-xs text-foreground">
                {t(tagKey)}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Link
          href={item.startPath}
          className={buttonVariants({ variant: featured ? "default" : "outline", size: "sm" })}
        >
          {t(item.ctaKey)}
        </Link>
      </CardFooter>
    </Card>
  );
}
