import { describe, expect, it } from "vitest";

import {
  buildCronExpressionFromTrigger,
  buildCronRunsLimit,
  extractZaloSenderIdsFromChannelsStatus,
  parseCronListOutput,
  parseCronRunsOutput,
  validateCronAddInput,
} from "@/lib/dashboard/cron-jobs";

describe("cron jobs helpers", () => {
  it("parses cron list from JSON array", () => {
    const list = parseCronListOutput(
      JSON.stringify([
        {
          id: "job-1",
          name: "Reminder",
          cron: "0 9 * * *",
          session: "main",
          message: "Check queue",
        },
      ])
    );

    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      id: "job-1",
      name: "Reminder",
      schedule: "0 9 * * *",
      session: "main",
      message: "Check queue",
    });
  });

  it("normalizes mixed job id values to UUID only", () => {
    const list = parseCronListOutput(
      JSON.stringify([
        {
          id: "796afd4b-5da7-4f3f-9d27-8ef3ac4a1625 Phân tích giá BTC",
          name: "Phân tích giá BTC",
          cron: "0 9 * * *",
          session: "main",
          message: "Analyze BTC",
        },
      ])
    );

    expect(list).toHaveLength(1);
    expect(list[0].id).toBe("796afd4b-5da7-4f3f-9d27-8ef3ac4a1625");
    expect(list[0].name).toBe("Phân tích giá BTC");
  });

  it("falls back to plain text list parsing", () => {
    const list = parseCronListOutput("job-a\njob-b\n");

    expect(list).toHaveLength(2);
    expect(list[0].name).toBe("job-a");
    expect(list[1].name).toBe("job-b");
  });

  it("ignores table header-only fallback output", () => {
    const list = parseCronListOutput(
      "ID Name Schedule Next Last Status Target Agent ID Model\n"
    );

    expect(list).toHaveLength(0);
  });

  it("parses runs from wrapped runs array", () => {
    const runs = parseCronRunsOutput(
      JSON.stringify({
        runs: [
          {
            runId: "run-1",
            status: "success",
            startedAt: "2026-04-09T10:00:00Z",
            finishedAt: "2026-04-09T10:00:02Z",
            summary: "completed",
          },
        ],
      })
    );

    expect(runs).toHaveLength(1);
    expect(runs[0]).toMatchObject({
      id: "run-1",
      status: "success",
      startedAt: "2026-04-09T10:00:00Z",
      finishedAt: "2026-04-09T10:00:02Z",
      summary: "completed",
    });
  });

  it("parses runs from ws payload.entries envelope", () => {
    const runs = parseCronRunsOutput(
      JSON.stringify({
        type: "res",
        id: "03f9f326-a337-405e-a4ba-001a6832f352",
        ok: true,
        payload: {
          entries: [
            {
              ts: 1775743952539,
              jobId: "796afd4b-5da7-4f3f-9d27-8ef3ac4a1625",
              action: "finished",
              status: "ok",
              summary: "BTC summary",
              runAtMs: 1775743740004,
              durationMs: 212531,
              nextRunAtMs: 1775830140000,
              model: "openclaw-smart-router",
              provider: "litellm",
              delivered: true,
              deliveryStatus: "delivered",
              sessionId: "8e3a8932-959a-4e9b-92ba-b8d07fb9f330",
              sessionKey:
                "agent:main:cron:796afd4b-5da7-4f3f-9d27-8ef3ac4a1625:run:8e3a8932-959a-4e9b-92ba-b8d07fb9f330",
            },
          ],
          total: 1,
          offset: 0,
          limit: 50,
          hasMore: false,
          nextOffset: null,
        },
      })
    );

    expect(runs).toHaveLength(1);
    expect(runs[0]).toMatchObject({
      id: "8e3a8932-959a-4e9b-92ba-b8d07fb9f330",
      status: "ok",
      startedAt: "2026-04-09T14:09:00.004Z",
      finishedAt: "2026-04-09T14:12:32.539Z",
      summary: "BTC summary",
    });
  });

  it("validates one-shot and recurring add payloads", () => {
    const invalid = validateCronAddInput({
      scheduleType: "at",
      name: "",
      session: "",
      message: "",
      at: "",
      cronMode: "day",
      triggerTime: "",
      triggerDayOfMonth: "1",
      tz: "",
      deliveryChannel: "none",
      senderId: "",
      wakeNow: false,
      deleteAfterRun: false,
    });

    expect(invalid.ok).toBe(false);
    expect(invalid.fieldErrors).toMatchObject({
      name: "required",
      session: "required",
      message: "required",
      at: "required",
    });

    const validCron = validateCronAddInput({
      scheduleType: "cron",
      name: "Every morning",
      session: "main",
      message: "Do work",
      at: "",
      cronMode: "day",
      triggerTime: "07:00",
      triggerDayOfMonth: "1",
      tz: "America/Los_Angeles",
      deliveryChannel: "zalo",
      senderId: "sender-1",
      wakeNow: false,
      deleteAfterRun: false,
    });

    expect(validCron.ok).toBe(true);

    const invalidDelivery = validateCronAddInput({
      scheduleType: "cron",
      name: "Daily",
      session: "main",
      message: "Do work",
      at: "",
      cronMode: "day",
      triggerTime: "07:00",
      triggerDayOfMonth: "1",
      tz: "",
      deliveryChannel: "zalo",
      senderId: "",
      wakeNow: false,
      deleteAfterRun: false,
    });

    expect(invalidDelivery.ok).toBe(false);
    expect(invalidDelivery.fieldErrors.senderId).toBe("required");

    const invalidTriggerTime = validateCronAddInput({
      scheduleType: "cron",
      name: "Invalid cron",
      session: "main",
      message: "Do work",
      at: "",
      cronMode: "day",
      triggerTime: "25:61",
      triggerDayOfMonth: "1",
      tz: "",
      deliveryChannel: "none",
      senderId: "",
      wakeNow: false,
      deleteAfterRun: false,
    });

    expect(invalidTriggerTime.ok).toBe(false);
    expect(invalidTriggerTime.fieldErrors.triggerTime).toBe("invalid");

    const invalidTriggerDay = validateCronAddInput({
      scheduleType: "cron",
      name: "Invalid day",
      session: "main",
      message: "Do work",
      at: "",
      cronMode: "month",
      triggerTime: "07:00",
      triggerDayOfMonth: "32",
      tz: "",
      deliveryChannel: "none",
      senderId: "",
      wakeNow: false,
      deleteAfterRun: false,
    });

    expect(invalidTriggerDay.ok).toBe(false);
    expect(invalidTriggerDay.fieldErrors.triggerDayOfMonth).toBe("invalid");

    const invalidTz = validateCronAddInput({
      scheduleType: "cron",
      name: "Invalid tz",
      session: "main",
      message: "Do work",
      at: "",
      cronMode: "day",
      triggerTime: "07:00",
      triggerDayOfMonth: "1",
      tz: "Not/A_Timezone",
      deliveryChannel: "none",
      senderId: "",
      wakeNow: false,
      deleteAfterRun: false,
    });

    expect(invalidTz.ok).toBe(false);
    expect(invalidTz.fieldErrors.tz).toBe("invalid");
  });

  it("builds cron expression from trigger selections", () => {
    const hourly = buildCronExpressionFromTrigger({
      scheduleType: "cron",
      name: "Hourly",
      session: "main",
      message: "Do work",
      at: "",
      cronMode: "hour",
      triggerTime: "09:30",
      triggerDayOfMonth: "1",
      tz: "",
      deliveryChannel: "none",
      senderId: "",
      wakeNow: false,
      deleteAfterRun: false,
    });

    const daily = buildCronExpressionFromTrigger({
      scheduleType: "cron",
      name: "Daily",
      session: "main",
      message: "Do work",
      at: "",
      cronMode: "day",
      triggerTime: "06:05",
      triggerDayOfMonth: "1",
      tz: "",
      deliveryChannel: "none",
      senderId: "",
      wakeNow: false,
      deleteAfterRun: false,
    });

    const monthly = buildCronExpressionFromTrigger({
      scheduleType: "cron",
      name: "Monthly",
      session: "main",
      message: "Do work",
      at: "",
      cronMode: "month",
      triggerTime: "22:15",
      triggerDayOfMonth: "25",
      tz: "",
      deliveryChannel: "none",
      senderId: "",
      wakeNow: false,
      deleteAfterRun: false,
    });

    expect(hourly).toBe("30 * * * *");
    expect(daily).toBe("5 6 * * *");
    expect(monthly).toBe("15 22 25 * *");
  });

  it("bounds run history limit", () => {
    expect(buildCronRunsLimit(undefined)).toBe(50);
    expect(buildCronRunsLimit(0)).toBe(1);
    expect(buildCronRunsLimit(999)).toBe(100);
    expect(buildCronRunsLimit(25.9)).toBe(25);
  });

  it("extracts zalo sender ids from channelAccounts payload", () => {
    const senderIds = extractZaloSenderIdsFromChannelsStatus({
      channelAccounts: {
        zalo: [
          { accountId: "a-1" },
          { sender_id: "a-2" },
          { senderId: "a-3" },
          { id: "a-4" },
          { accountId: "a-1" },
        ],
      },
    });

    expect(senderIds).toEqual(["a-1", "a-2", "a-3", "a-4"]);
  });
});
