import { describe, expect, it } from "vitest";

import {
  normalizeDashboardJobs,
  upsertDashboardJob,
  type DashboardJob,
} from "@/lib/dashboard/jobs";

describe("dashboard jobs", () => {
  it("sorts running jobs before settled jobs", () => {
    const now = Date.now();
    const jobs: DashboardJob[] = [
      {
        id: "done-1",
        source: "agent",
        title: "Agent execution",
        status: "done",
        summary: "Completed",
        startedAt: now - 5000,
        updatedAt: now - 1000,
      },
      {
        id: "running-1",
        source: "command",
        title: "Operator command",
        status: "running",
        summary: "openclaw pairing list",
        startedAt: now - 2500,
        updatedAt: now - 500,
      },
      {
        id: "failed-1",
        source: "command",
        title: "Operator command",
        status: "failed",
        summary: "Timed out",
        startedAt: now - 8000,
        updatedAt: now - 1500,
      },
    ];

    const normalized = normalizeDashboardJobs(jobs);

    expect(normalized[0].id).toBe("running-1");
    expect(normalized.slice(1).map((job) => job.id)).toEqual([
      "done-1",
      "failed-1",
    ]);
  });

  it("bounds settled history while keeping all running jobs", () => {
    const now = Date.now();
    const settled = Array.from({ length: 5 }).map((_, index) => ({
      id: `done-${index}`,
      source: "agent" as const,
      title: "Agent execution",
      status: "done" as const,
      summary: "Completed",
      startedAt: now - 3000 - index,
      updatedAt: now - index,
    }));

    const running: DashboardJob[] = [
      {
        id: "running-1",
        source: "command",
        title: "Operator command",
        status: "running",
        summary: "openclaw pairing list",
        startedAt: now - 1000,
        updatedAt: now + 100,
      },
    ];

    const normalized = normalizeDashboardJobs([...settled, ...running], 2);

    expect(normalized).toHaveLength(3);
    expect(normalized[0].id).toBe("running-1");
    expect(normalized[1].id).toBe("done-0");
    expect(normalized[2].id).toBe("done-1");
  });

  it("upserts existing jobs by id", () => {
    const now = Date.now();
    const initial: DashboardJob[] = [
      {
        id: "job-1",
        source: "agent",
        title: "Agent execution",
        status: "running",
        summary: "Prompt",
        startedAt: now,
        updatedAt: now,
      },
    ];

    const updated = upsertDashboardJob(initial, {
      id: "job-1",
      source: "agent",
      title: "Agent execution",
      status: "done",
      summary: "Completed",
      startedAt: now,
      updatedAt: now + 100,
      endedAt: now + 100,
    });

    expect(updated).toHaveLength(1);
    expect(updated[0].status).toBe("done");
    expect(updated[0].summary).toBe("Completed");
  });
});
