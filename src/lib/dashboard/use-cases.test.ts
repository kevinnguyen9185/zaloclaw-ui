import { describe, expect, it } from "vitest";

import {
  DASHBOARD_USE_CASES,
  resolveFeaturedUseCase,
  splitUseCasesForDashboard,
} from "@/lib/dashboard/use-cases";

describe("dashboard use cases", () => {
  it("ships a single first-release use case", () => {
    expect(DASHBOARD_USE_CASES).toHaveLength(1);
    expect(DASHBOARD_USE_CASES[0]?.id).toBe("simple-assistant");
  });

  it("resolves the primary assistant use case without standard or hidden items", () => {
    expect(resolveFeaturedUseCase(DASHBOARD_USE_CASES)?.id).toBe("simple-assistant");
    expect(splitUseCasesForDashboard(DASHBOARD_USE_CASES, 4)).toEqual({
      featured: DASHBOARD_USE_CASES[0],
      standard: [],
      hiddenCount: 0,
    });
  });
});