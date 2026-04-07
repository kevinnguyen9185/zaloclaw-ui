"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Zap } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { useGateway } from "@/lib/gateway/context";
import { useLocalization } from "@/lib/i18n/context";

type SkillEntry = {
  name: string;
  skillKey: string;
  description: string | null;
  disabled: boolean;
  always: boolean;
  eligible: boolean;
  bundled: boolean;
  metadata: Array<{ key: string; value: string }>;
};

const HIDDEN_METADATA_KEYS = new Set([
  "name",
  "skillKey",
  "description",
  "disabled",
  "always",
  "eligible",
  "bundled",
]);

function formatMetadataValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null) return "null";

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function parseSkillsStatusResponse(value: unknown): SkillEntry[] {
  if (typeof value !== "object" || value === null) return [];
  const obj = value as Record<string, unknown>;
  const skills = obj["skills"];
  if (!Array.isArray(skills)) return [];
  return skills
    .filter((s): s is Record<string, unknown> => typeof s === "object" && s !== null)
    .map((s) => ({
      name: typeof s["name"] === "string" ? s["name"] : String(s["skillKey"] ?? ""),
      skillKey: typeof s["skillKey"] === "string" ? s["skillKey"] : "",
      description:
        typeof s["description"] === "string" && s["description"].trim().length > 0
          ? s["description"]
          : null,
      disabled: s["disabled"] === true,
      always: s["always"] === true,
      eligible: s["eligible"] === true,
      bundled: s["bundled"] === true,
      metadata: Object.entries(s)
        .filter(([key]) => !HIDDEN_METADATA_KEYS.has(key))
        .map(([key, rawValue]) => ({
          key,
          value: formatMetadataValue(rawValue),
        })),
    }))
    .filter((s) => !s.disabled && s.eligible);
}

export function DataSkillsSection() {
  const { t } = useLocalization();
  const { status, send } = useGateway();

  const [enabledSkills, setEnabledSkills] = useState<SkillEntry[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<SkillEntry | null>(null);

  useEffect(() => {
    if (status !== "connected") {
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoadError(null);
      try {
        const response = await send("skills.status");
        if (cancelled) return;
        setEnabledSkills(parseSkillsStatusResponse(response));
      } catch {
        if (cancelled) return;
        setLoadError(t("dashboard.dataSkills.loadError"));
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [status, send, t]);

  const isConnected = status === "connected";

  return (
    <section aria-label={t("dashboard.dataSkills.sectionTitle")} className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            {t("dashboard.dataSkills.sectionTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("dashboard.dataSkills.sectionSubtitle")}
          </p>
        </div>
        <Link
          href="http://localhost:18789/chat?session=main"
          target="_blank"
          rel="noreferrer noopener"
          className="rounded-md border border-border/80 bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          {t("dashboard.dataSkills.openClawSession")}
        </Link>
      </div>

      {loadError ? (
        <p className="mb-3 text-sm text-destructive">{loadError}</p>
      ) : null}

      {isConnected && !loadError && enabledSkills.length === 0 ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            {t("dashboard.dataSkills.empty")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2 sm:grid-cols-3">
          {enabledSkills.map((skill) => (
            <Card
              key={skill.skillKey}
              className="cursor-pointer border-primary/35 bg-primary/[0.035] transition-colors hover:bg-primary/[0.06]"
              role="button"
              tabIndex={0}
              onClick={() => setSelectedSkill(skill)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedSkill(skill);
                }
              }}
            >
              <CardContent className="flex flex-col gap-1.5 p-2.5">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 rounded-md bg-primary/10 p-1 text-primary">
                    <Zap className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {skill.name}
                    </p>
                    <p className="truncate font-mono text-[10px] text-muted-foreground">
                      {skill.skillKey}
                    </p>
                  </div>
                </div>

                <p className="line-clamp-1 text-[11px] text-muted-foreground">
                  {skill.description ?? t("dashboard.dataSkills.detailsNoDescription")}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {skill.bundled ? (
                    <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {t("dashboard.dataSkills.badge.bundled")}
                    </span>
                  ) : null}
                  {skill.always ? (
                    <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {t("dashboard.dataSkills.badge.always")}
                    </span>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedSkill ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-label={t("dashboard.dataSkills.detailsTitle")}
          onClick={() => setSelectedSkill(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-border bg-background shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {selectedSkill.name}
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  {selectedSkill.skillKey}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSkill(null)}
                className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
              >
                {t("dashboard.dataSkills.close")}
              </button>
            </div>

            <div className="space-y-4 px-4 py-4">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("dashboard.dataSkills.detailsDescription")}
                </p>
                <p className="text-sm text-foreground">
                  {selectedSkill.description ?? t("dashboard.dataSkills.detailsNoDescription")}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("dashboard.dataSkills.detailsMetadata")}
                </p>
                {selectedSkill.metadata.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("dashboard.dataSkills.detailsNoMetadata")}
                  </p>
                ) : (
                  <div className="max-h-56 space-y-2 overflow-auto rounded-md border border-border/80 bg-muted/20 p-2">
                    {selectedSkill.metadata.map((item) => (
                      <div
                        key={`${selectedSkill.skillKey}-${item.key}`}
                        className="grid grid-cols-[120px,1fr] gap-2 text-xs"
                      >
                        <span className="font-mono text-muted-foreground">{item.key}</span>
                        <span className="break-all text-foreground">{item.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
