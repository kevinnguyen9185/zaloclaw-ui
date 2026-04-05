export type UseCaseEffort = "quick" | "standard" | "advanced";

export type UseCaseItem = {
  id: string;
  titleKey: string;
  outcomeKey: string;
  tagKeys: string[];
  effort: UseCaseEffort;
  ctaKey: string;
  startPath: string;
  featured?: boolean;
  sortOrder: number;
};

export const DASHBOARD_USE_CASES: UseCaseItem[] = [
  {
    id: "simple-assistant",
    titleKey: "dashboard.usecase.simple.title",
    outcomeKey: "dashboard.usecase.simple.outcome",
    tagKeys: [
      "dashboard.usecase.simple.tag1",
      "dashboard.usecase.simple.tag2",
      "dashboard.usecase.simple.tag3",
    ],
    effort: "quick",
    ctaKey: "dashboard.usecase.start",
    startPath: "/dashboard?useCase=simple-assistant",
    featured: true,
    sortOrder: 1,
  },
];

export function resolveFeaturedUseCase(items: UseCaseItem[]): UseCaseItem | null {
  if (items.length === 0) {
    return null;
  }

  const ordered = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
  return ordered.find((item) => item.featured === true) ?? ordered[0];
}

export function splitUseCasesForDashboard(items: UseCaseItem[], maxVisible = 4): {
  featured: UseCaseItem | null;
  standard: UseCaseItem[];
  hiddenCount: number;
} {
  const featured = resolveFeaturedUseCase(items);
  if (!featured) {
    return { featured: null, standard: [], hiddenCount: 0 };
  }

  const ordered = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
  const others = ordered.filter((item) => item.id !== featured.id);
  const standardVisibleCount = Math.max(0, maxVisible - 1);
  const standard = others.slice(0, standardVisibleCount);

  return {
    featured,
    standard,
    hiddenCount: Math.max(0, others.length - standard.length),
  };
}
