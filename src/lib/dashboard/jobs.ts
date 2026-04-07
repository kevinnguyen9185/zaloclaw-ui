export type DashboardJobStatus = "running" | "done" | "failed";

export type DashboardJobSource = "agent" | "command";

export type DashboardJob = {
  id: string;
  source: DashboardJobSource;
  title: string;
  status: DashboardJobStatus;
  summary: string;
  startedAt: number;
  updatedAt: number;
  endedAt?: number;
  runId?: string;
  command?: string;
};

const DEFAULT_MAX_RECENT_SETTLED_JOBS = 12;

export function upsertDashboardJob(
  jobs: DashboardJob[],
  nextJob: DashboardJob
): DashboardJob[] {
  const index = jobs.findIndex((job) => job.id === nextJob.id);
  if (index < 0) {
    return [nextJob, ...jobs];
  }

  const clone = [...jobs];
  clone[index] = {
    ...clone[index],
    ...nextJob,
  };
  return clone;
}

export function normalizeDashboardJobs(
  jobs: DashboardJob[],
  maxRecentSettled = DEFAULT_MAX_RECENT_SETTLED_JOBS
): DashboardJob[] {
  const running = jobs
    .filter((job) => job.status === "running")
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const settled = jobs
    .filter((job) => job.status !== "running")
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, maxRecentSettled);

  return [...running, ...settled];
}

