import { describe, expect, it } from "vitest";

import {
  buildOperatorResultSummary,
  validateOperatorCommandInput,
} from "@/lib/dashboard/operator-command";

describe("operator command", () => {
  it("accepts valid openclaw commands", () => {
    expect(validateOperatorCommandInput("openclaw pairing list")).toEqual({
      ok: true,
      normalized: "openclaw pairing list",
      error: null,
    });
  });

  it("rejects empty command", () => {
    expect(validateOperatorCommandInput("  ")).toEqual({
      ok: false,
      normalized: "",
      error: "empty",
    });
  });

  it("rejects command without openclaw prefix", () => {
    expect(validateOperatorCommandInput("pairing list")).toEqual({
      ok: false,
      normalized: "pairing list",
      error: "mustStartWithOpenclaw",
    });
  });

  it("rejects unsafe characters", () => {
    expect(validateOperatorCommandInput("openclaw pairing list; rm -rf /")).toEqual({
      ok: false,
      normalized: "openclaw pairing list; rm -rf /",
      error: "unsafe",
    });
  });

  it("builds success and error summaries from command results", () => {
    expect(
      buildOperatorResultSummary({
        ok: true,
        command: "openclaw pairing list",
        exitCode: 0,
        stdout: "pairing-1\npairing-2",
        stderr: "",
        timedOut: false,
      })
    ).toBe("pairing-1");

    expect(
      buildOperatorResultSummary({
        ok: false,
        command: "openclaw pairing list",
        exitCode: 1,
        stdout: "",
        stderr: "permission denied\nmore",
        timedOut: false,
      })
    ).toBe("permission denied");
  });
});
