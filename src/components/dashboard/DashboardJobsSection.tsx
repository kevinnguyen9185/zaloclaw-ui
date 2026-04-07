"use client";

import { useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardChat } from "@/lib/dashboard/chat";
import type { DashboardJob } from "@/lib/dashboard/jobs";
import { useLocalization } from "@/lib/i18n/context";

function formatClockTime(value: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(value);
}

function formatDurationMs(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}

function statusClassName(status: DashboardJob["status"]): string {
  if (status === "running") {
    return "border-primary/40 bg-primary/[0.04] text-primary";
  }

  if (status === "failed") {
    return "border-destructive/40 bg-destructive/[0.08] text-destructive";
  }

  return "border-emerald-500/40 bg-emerald-500/[0.08] text-emerald-700 dark:text-emerald-300";
}

function translateStatus(status: DashboardJob["status"], t: (key: string) => string): string {
  if (status === "running") {
    return t("dashboard.jobs.status.running");
  }
  if (status === "failed") {
    return t("dashboard.jobs.status.failed");
  }
  return t("dashboard.jobs.status.done");
}

export function DashboardJobsSection() {
  const { t } = useLocalization();
  const { jobs } = useDashboardChat();

  const visibleJobs = useMemo(() => jobs.slice(0, 8), [jobs]);

  return (
    <section aria-label={t("dashboard.jobs.title")} className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-foreground">{t("dashboard.jobs.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("dashboard.jobs.subtitle")}</p>
      </div>

      {visibleJobs.length === 0 ? (
        <Card className="border border-dashed border-border/80 bg-card/70">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            {t("dashboard.jobs.empty")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {visibleJobs.map((job) => {
            const endedAt = job.endedAt ?? Date.now();
            return (
              <Card key={job.id} className="border border-border/80 bg-card/90">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-sm font-semibold text-foreground">{job.title}</CardTitle>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusClassName(job.status)}`}
                    >
                      {translateStatus(job.status, t)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-muted-foreground">
                  <p className="text-sm text-foreground/90">{job.summary}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>{`${t("dashboard.jobs.meta.started")} ${formatClockTime(job.startedAt)}`}</span>
                    <span>{`${t("dashboard.jobs.meta.duration")} ${formatDurationMs(endedAt - job.startedAt)}`}</span>
                    {job.runId ? <span>{`${t("dashboard.jobs.meta.runId")} ${job.runId}`}</span> : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
