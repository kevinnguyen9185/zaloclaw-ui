"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Info, Loader2, Plus, RefreshCcw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildCronExpressionFromTrigger,
  buildCronRunsLimit,
  parseCronListOutput,
  parseCronRunsOutput,
  type CronAddInput,
  type CronJob,
  type CronRun,
  summarizeCronActionResult,
  validateCronAddInput,
} from "@/lib/dashboard/cron-jobs";
import {
  runCronAction,
  type CronAddRequest,
  type CronScheduleType,
} from "@/lib/gateway/cron-command-service";
import { useGateway } from "@/lib/gateway/context";
import { useLocalization } from "@/lib/i18n/context";

type AddFormState = CronAddInput;

const INITIAL_FORM_STATE: AddFormState = {
  scheduleType: "at",
  name: "",
  session: "main",
  message: "",
  at: "",
  cronMode: "day",
  triggerTime: "09:00",
  triggerDayOfMonth: "1",
  tz: "Asia/Ho_Chi_Minh",
  deliveryChannel: "none",
  senderId: "",
  wakeNow: true,
  deleteAfterRun: true,
};

function getDefaultAtValue(): string {
  const now = new Date();
  const next = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return next.toISOString();
}

export function DashboardCronJobsSection() {
  const { t } = useLocalization();
  const { status: gatewayStatus, send } = useGateway();

  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [addErrorMessage, setAddErrorMessage] = useState<string | null>(null);
  const [formState, setFormState] = useState<AddFormState>(INITIAL_FORM_STATE);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof AddFormState, string>>>({});


  const [deletePendingId, setDeletePendingId] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const [historyJobId, setHistoryJobId] = useState<string | null>(null);
  const [historyRuns, setHistoryRuns] = useState<CronRun[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const activeHistoryJob = useMemo(
    () => jobs.find((job) => job.id === historyJobId) ?? null,
    [historyJobId, jobs]
  );

  const loadJobs = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await runCronAction({ action: "list" });
      if (!result.ok) {
        throw new Error(summarizeCronActionResult(result));
      }

      setJobs(parseCronListOutput(result.stdout));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("dashboard.cron.errors.loadFailed");
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  const loadHistory = useCallback(
    async (jobId: string, limit = 50) => {
      setHistoryLoading(true);
      setHistoryError(null);

      try {
        const boundedLimit = buildCronRunsLimit(limit);

        // Prefer gateway RPC so the WS traffic includes method "cron.runs".
        if (gatewayStatus === "connected") {
          try {
            const wsPayload = await send("cron.runs", {
              scope: "job",
              id: jobId,
              limit: boundedLimit,
              offset: 0,
              status: "all",
              sortDir: "desc",
            });

            setHistoryRuns(parseCronRunsOutput(JSON.stringify(wsPayload)));
            return;
          } catch {
            // Fall back to route-based action if RPC is unavailable on the server.
          }
        }

        const result = await runCronAction({
          action: "runs",
          id: jobId,
          limit: boundedLimit,
        });

        if (!result.ok) {
          throw new Error(summarizeCronActionResult(result));
        }

        setHistoryRuns(parseCronRunsOutput(result.stdout));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : t("dashboard.cron.errors.historyFailed");
        setHistoryError(message);
      } finally {
        setHistoryLoading(false);
      }
    },
    [gatewayStatus, send, t]
  );

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  const handleOpenAdd = () => {
    setFormState({
      ...INITIAL_FORM_STATE,
      at: getDefaultAtValue(),
    });
    setFieldErrors({});
    setAddErrorMessage(null);
    setIsAddOpen(true);
  };



  const handleAddSubmit = async () => {
    setAddErrorMessage(null);

    const validation = validateCronAddInput(formState);
    if (!validation.ok) {
      setFieldErrors(validation.fieldErrors);
      return;
    }

    setFieldErrors({});
    setIsSubmittingAdd(true);

    const payload: CronAddRequest = {
      action: "add",
      scheduleType: formState.scheduleType,
      name: formState.name.trim(),
      session: formState.session.trim(),
      message: formState.message.trim(),
      ...(formState.scheduleType === "at"
        ? {
            at: formState.at.trim(),
            wakeNow: formState.wakeNow,
            deleteAfterRun: formState.deleteAfterRun,
          }
        : {
            cron: buildCronExpressionFromTrigger(formState),
            tz: formState.tz.trim() || undefined,
          }),
      ...(formState.deliveryChannel === "zalo"
        ? {
            channel: "zalo" as const,
            account: formState.senderId.trim(),
          }
        : {}),
    };

    try {
      const result = await runCronAction(payload);
      if (!result.ok) {
        throw new Error(summarizeCronActionResult(result));
      }

      setIsAddOpen(false);
      await loadJobs();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("dashboard.cron.errors.addFailed");
      setAddErrorMessage(message);
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleDelete = async (jobId: string) => {
    setDeletePendingId(null);
    setIsDeletingId(jobId);

    try {
      const result = await runCronAction({ action: "remove", id: jobId });
      if (!result.ok) {
        throw new Error(summarizeCronActionResult(result));
      }

      if (historyJobId === jobId) {
        setHistoryJobId(null);
        setHistoryRuns([]);
        setHistoryError(null);
      }
      await loadJobs();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("dashboard.cron.errors.deleteFailed");
      setErrorMessage(message);
    } finally {
      setIsDeletingId(null);
    }
  };

  const toggleHistory = async (jobId: string) => {
    if (historyJobId === jobId) {
      setHistoryJobId(null);
      setHistoryRuns([]);
      setHistoryError(null);
      return;
    }

    setHistoryJobId(jobId);
    await loadHistory(jobId);
  };

  return (
    <section aria-label={t("dashboard.cron.title")} className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">{t("dashboard.cron.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("dashboard.cron.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadJobs()}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="mr-1 h-3.5 w-3.5" />}
            {t("dashboard.cron.actions.refresh")}
          </Button>
          <Button type="button" size="sm" onClick={handleOpenAdd}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            {t("dashboard.cron.actions.add")}
          </Button>
        </div>
      </div>

      {errorMessage ? (
        <Card className="border-destructive/50">
          <CardContent className="pt-4 text-sm text-destructive">{errorMessage}</CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center gap-2 pt-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("dashboard.cron.loading")}
          </CardContent>
        </Card>
      ) : jobs.length === 0 ? (
        <Card className="border border-dashed border-border/80 bg-card/70">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            {t("dashboard.cron.empty")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {jobs.map((job) => {
            const isDeletePending = deletePendingId === job.id;
            const isDeleting = isDeletingId === job.id;
            const historyOpen = historyJobId === job.id;

            return (
              <Card key={job.id} className="border border-border/80 bg-card/90">
                <CardHeader className="space-y-2 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-semibold text-foreground">{job.name}</CardTitle>
                    <span className="rounded-full border border-primary/40 bg-primary/[0.04] px-2 py-0.5 text-[11px] font-medium text-primary">
                      {job.id}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{`${t("dashboard.cron.meta.schedule")} ${job.schedule}`}</p>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="grid gap-1 text-muted-foreground">
                    <p>{`${t("dashboard.cron.meta.session")} ${job.session}`}</p>
                    {job.message ? <p>{`${t("dashboard.cron.meta.message")} ${job.message}`}</p> : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void toggleHistory(job.id)}
                      disabled={historyLoading && historyOpen}
                    >
                      {historyOpen ? t("dashboard.cron.actions.hideHistory") : t("dashboard.cron.actions.viewHistory")}
                    </Button>

                    {!isDeletePending ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeletePendingId(job.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        {t("dashboard.cron.actions.delete")}
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1">
                        <span className="text-[11px] text-destructive">{t("dashboard.cron.delete.confirm")}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => void handleDelete(job.id)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? t("dashboard.cron.actions.deleting") : t("dashboard.cron.actions.confirmDelete")}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setDeletePendingId(null)}
                          disabled={isDeleting}
                        >
                          {t("dashboard.cron.actions.cancel")}
                        </Button>
                      </div>
                    )}
                  </div>

                  {historyOpen ? (
                    <div className="space-y-2 rounded-md border border-border/70 bg-background/70 p-2">
                      <p className="text-xs font-semibold text-foreground">{t("dashboard.cron.history.title")}</p>
                      {historyLoading ? (
                        <p className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          {t("dashboard.cron.history.loading")}
                        </p>
                      ) : historyError ? (
                        <div className="space-y-2">
                          <p className="text-xs text-destructive">{historyError}</p>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => activeHistoryJob && void loadHistory(activeHistoryJob.id)}
                          >
                            {t("dashboard.cron.actions.retry")}
                          </Button>
                        </div>
                      ) : historyRuns.length === 0 ? (
                        <p className="text-xs text-muted-foreground">{t("dashboard.cron.history.empty")}</p>
                      ) : (
                        <div className="space-y-2">
                          {historyRuns.map((run) => (
                            <div
                              key={`${job.id}-${run.id}`}
                              className="rounded-md border border-border/60 bg-background p-2"
                            >
                              <p className="font-mono text-[11px] text-foreground">{run.id}</p>
                              <p className="text-[11px] text-muted-foreground">{`${t("dashboard.cron.history.status")} ${run.status}`}</p>
                              <p className="text-[11px] text-muted-foreground">{`${t("dashboard.cron.history.started")} ${run.startedAt}`}</p>
                              {run.finishedAt ? (
                                <p className="text-[11px] text-muted-foreground">{`${t("dashboard.cron.history.finished")} ${run.finishedAt}`}</p>
                              ) : null}
                              <p className="text-[11px] text-foreground/90">{run.summary}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {isAddOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-label={t("dashboard.cron.add.title")}
          onClick={() => setIsAddOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-xl border border-border bg-background shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{t("dashboard.cron.add.title")}</p>
                <p className="text-xs text-muted-foreground">{t("dashboard.cron.add.subtitle")}</p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={() => setIsAddOpen(false)}>
                {t("dashboard.cron.actions.close")}
              </Button>
            </div>

            <div className="space-y-3 px-4 py-4">
              <div className="grid gap-1">
                <label className="text-xs font-medium text-foreground" htmlFor="cron-schedule-type">
                  {t("dashboard.cron.add.scheduleType")}
                </label>
                <select
                  id="cron-schedule-type"
                  value={formState.scheduleType}
                  onChange={(event) => {
                    const next = event.target.value as CronScheduleType;
                    setFormState((previous) => ({ ...previous, scheduleType: next }));
                  }}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="at">{t("dashboard.cron.add.scheduleAt")}</option>
                  <option value="cron">{t("dashboard.cron.add.scheduleCron")}</option>
                </select>
              </div>

              <div className="grid gap-1">
                <label className="text-xs font-medium text-foreground" htmlFor="cron-name">
                  {t("dashboard.cron.add.name")}
                </label>
                <input
                  id="cron-name"
                  value={formState.name}
                  onChange={(event) => setFormState((previous) => ({ ...previous, name: event.target.value }))}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                />
                {fieldErrors.name ? <p className="text-xs text-destructive">{t("dashboard.cron.add.required")}</p> : null}
              </div>

              <p className="text-xs text-muted-foreground">{t("dashboard.cron.add.sessionFixedMain")}</p>

              <div className="grid gap-1">
                <label className="text-xs font-medium text-foreground" htmlFor="cron-message">
                  {t("dashboard.cron.add.task")}
                </label>
                <textarea
                  id="cron-message"
                  value={formState.message}
                  onChange={(event) => setFormState((previous) => ({ ...previous, message: event.target.value }))}
                  rows={3}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                {fieldErrors.message ? <p className="text-xs text-destructive">{t("dashboard.cron.add.required")}</p> : null}
              </div>

              <div className="space-y-2 rounded-md border border-border/70 bg-muted/20 p-3">
                <div className="grid gap-1">
                  <label className="text-xs font-medium text-foreground" htmlFor="cron-delivery-channel">
                    {t("dashboard.cron.add.deliveryChannel")}
                  </label>
                  <select
                    id="cron-delivery-channel"
                    value={formState.deliveryChannel}
                    onChange={(event) =>
                      setFormState((previous) => ({
                        ...previous,
                        deliveryChannel: event.target.value as "none" | "zalo",
                      }))
                    }
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="none">{t("dashboard.cron.add.deliveryNone")}</option>
                    <option value="zalo">{t("dashboard.cron.add.deliveryZalo")}</option>
                  </select>
                </div>

                {formState.deliveryChannel === "zalo" ? (
                  <div className="grid gap-1">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-foreground" htmlFor="cron-sender-id">
                        {t("dashboard.cron.add.senderId")}
                      </label>
                      <button
                        type="button"
                        className="group relative"
                        title={t("dashboard.cron.add.senderIdHint")}
                      >
                        <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                        <div className="invisible absolute bottom-full left-1/2 mb-2 w-48 -translate-x-1/2 rounded-md bg-popover px-2 py-1 text-center text-xs text-popover-foreground shadow-md group-hover:visible">
                          {t("dashboard.cron.add.senderIdHint")}
                        </div>
                      </button>
                    </div>
                    <input
                      id="cron-sender-id"
                      value={formState.senderId}
                      onChange={(event) =>
                        setFormState((previous) => ({ ...previous, senderId: event.target.value }))
                      }
                      placeholder={t("dashboard.cron.add.senderIdPlaceholder")}
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    />
                    <p className="text-xs text-muted-foreground">{t("dashboard.cron.add.senderIdDescription")}</p>
                    {fieldErrors.senderId ? (
                      <p className="text-xs text-destructive">{t("dashboard.cron.add.required")}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {formState.scheduleType === "at" ? (
                <div className="grid gap-1">
                  <label className="text-xs font-medium text-foreground" htmlFor="cron-at">
                    {t("dashboard.cron.add.at")}
                  </label>
                  <input
                    id="cron-at"
                    type="text"
                    value={formState.at}
                    onChange={(event) => setFormState((previous) => ({ ...previous, at: event.target.value }))}
                    placeholder={t("dashboard.cron.add.atPlaceholder")}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  />
                  {fieldErrors.at ? <p className="text-xs text-destructive">{t("dashboard.cron.add.required")}</p> : null}
                  <p className="text-xs text-muted-foreground">{t("dashboard.cron.add.atHint")}</p>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={formState.wakeNow}
                      onChange={(event) => setFormState((previous) => ({ ...previous, wakeNow: event.target.checked }))}
                    />
                    {t("dashboard.cron.add.wakeNow")}
                  </label>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={formState.deleteAfterRun}
                      onChange={(event) =>
                        setFormState((previous) => ({ ...previous, deleteAfterRun: event.target.checked }))
                      }
                    />
                    {t("dashboard.cron.add.deleteAfterRun")}
                  </label>
                </div>
              ) : (
                <div className="space-y-3 rounded-md border border-border/70 bg-muted/20 p-3">
                  <div className="grid gap-1">
                    <label className="text-xs font-medium text-foreground" htmlFor="cron-mode">
                      {t("dashboard.cron.add.cronMode")}
                    </label>
                    <select
                      id="cron-mode"
                      value={formState.cronMode}
                      onChange={(event) =>
                        setFormState((previous) => ({
                          ...previous,
                          cronMode: event.target.value as "hour" | "day" | "month",
                        }))
                      }
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="month">{t("dashboard.cron.add.cronMode.month")}</option>
                      <option value="day">{t("dashboard.cron.add.cronMode.day")}</option>
                      <option value="hour">{t("dashboard.cron.add.cronMode.hour")}</option>
                    </select>
                  </div>

                  <div className="grid gap-1">
                    <label className="text-xs font-medium text-foreground" htmlFor="cron-trigger-time">
                      {t("dashboard.cron.add.triggerTime")}
                    </label>
                    <input
                      id="cron-trigger-time"
                      type="time"
                      value={formState.triggerTime}
                      onChange={(event) =>
                        setFormState((previous) => ({ ...previous, triggerTime: event.target.value }))
                      }
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    />
                    {fieldErrors.triggerTime ? (
                      <p className="text-xs text-destructive">{t("dashboard.cron.add.triggerTimeInvalid")}</p>
                    ) : null}
                  </div>

                  {formState.cronMode === "month" ? (
                    <div className="grid gap-1">
                      <label className="text-xs font-medium text-foreground" htmlFor="cron-trigger-day-of-month">
                        {t("dashboard.cron.add.triggerDayOfMonth")}
                      </label>
                      <input
                        id="cron-trigger-day-of-month"
                        type="number"
                        min={1}
                        max={31}
                        value={formState.triggerDayOfMonth}
                        onChange={(event) =>
                          setFormState((previous) => ({
                            ...previous,
                            triggerDayOfMonth: event.target.value,
                          }))
                        }
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                      />
                      {fieldErrors.triggerDayOfMonth ? (
                        <p className="text-xs text-destructive">{t("dashboard.cron.add.triggerDayOfMonthInvalid")}</p>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="grid gap-1">
                    <label className="text-xs font-medium text-foreground" htmlFor="cron-timezone">
                      {t("dashboard.cron.add.timezoneOptional")}
                    </label>
                    <input
                      id="cron-timezone"
                      type="text"
                      value={formState.tz}
                      onChange={(event) =>
                        setFormState((previous) => ({ ...previous, tz: event.target.value }))
                      }
                      placeholder={t("dashboard.cron.add.timezonePlaceholder")}
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    />
                    {fieldErrors.tz ? (
                      <p className="text-xs text-destructive">{t("dashboard.cron.add.timezoneInvalid")}</p>
                    ) : null}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {`${t("dashboard.cron.add.cronPreview")} ${buildCronExpressionFromTrigger(formState) || "-"}`}
                  </p>
                </div>
              )}

              {addErrorMessage ? <p className="text-xs text-destructive">{addErrorMessage}</p> : null}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                  {t("dashboard.cron.actions.cancel")}
                </Button>
                <Button type="button" onClick={() => void handleAddSubmit()} disabled={isSubmittingAdd}>
                  {isSubmittingAdd ? t("dashboard.cron.actions.creating") : t("dashboard.cron.actions.create")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
