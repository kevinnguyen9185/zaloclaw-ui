import { describe, expect, it } from "vitest";

import { POST } from "@/app/api/gateway/cron-action/route";
import { buildCronArgs } from "@/lib/gateway/cron-route-args";

describe("POST /api/gateway/cron-action", () => {
  it("rejects unsupported actions with HTTP 400", async () => {
    const response = await POST(
      new Request("http://localhost/api/gateway/cron-action", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "edit" }),
      })
    );

    expect(response.status).toBe(400);
    const payload = (await response.json()) as { error?: string };
    expect(payload.error).toBe("Unsupported action.");
  });

  it("rejects unsafe input before command execution", async () => {
    const response = await POST(
      new Request("http://localhost/api/gateway/cron-action", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "add",
          scheduleType: "cron",
          name: "daily-job",
          session: "main",
          message: "ok; rm -rf /",
          cron: "0 6 * * *",
        }),
      })
    );

    expect(response.status).toBe(400);
    const payload = (await response.json()) as { error?: string };
    expect(payload.error).toBe("message contains unsafe characters.");
  });

  it("uses --to and isolated session for delivery targets", () => {
    const built = buildCronArgs({
      action: "add",
      scheduleType: "cron",
      name: "Morning brief",
      session: "main",
      message: "Summarize overnight updates.",
      cron: "0 7 * * *",
      tz: "America/Los_Angeles",
      channel: "zalo",
      account: "1389996bd6203f7e6631",
    });

    expect(built.action).toBe("add");
    expect(built.args).toContain("--announce");
    expect(built.args).toContain("--channel");
    expect(built.args).toContain("zalo");
    expect(built.args).toContain("--to");
    expect(built.args).toContain("1389996bd6203f7e6631");
    expect(built.args).toContain("--tz");
    expect(built.args).toContain("America/Los_Angeles");
    expect(built.args).not.toContain("--account");

    const sessionIndex = built.args.indexOf("--session");
    expect(sessionIndex).toBeGreaterThan(-1);
    expect(built.args[sessionIndex + 1]).toBe("isolated");
  });
});
