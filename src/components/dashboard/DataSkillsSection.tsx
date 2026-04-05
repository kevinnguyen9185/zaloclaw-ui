"use client";

import { useEffect, useState } from "react";
import { HardDrive, FileText, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  createGatewayConfigService,
  type ConfigPatchOperation,
} from "@/lib/gateway/config";
import { useGateway } from "@/lib/gateway/context";
import { useLocalization } from "@/lib/i18n/context";

const SKILL_IDS = ["google-drive", "google-docs", "file-qa"] as const;
type SkillId = (typeof SKILL_IDS)[number];
type SkillState = Record<SkillId, boolean>;

function readSkillsFromEntries(entries: Record<string, unknown>): SkillState {
  const entry = (id: string) =>
    !!(
      (entries[id] as Record<string, unknown> | undefined)?.enabled === true
    );
  return {
    "google-drive": entry("google-drive"),
    "google-docs": entry("google-docs"),
    "file-qa": entry("file-qa"),
  };
}

const SKILL_ICONS: Record<SkillId, React.ComponentType<{ className?: string }>> = {
  "google-drive": HardDrive,
  "google-docs": FileText,
  "file-qa": Search,
};

const SKILL_TITLE_KEYS: Record<SkillId, string> = {
  "google-drive": "dashboard.dataSkills.googleDrive.name",
  "google-docs": "dashboard.dataSkills.googleDocs.name",
  "file-qa": "dashboard.dataSkills.fileQa.name",
};

const SKILL_DESCRIPTION_KEYS: Record<SkillId, string> = {
  "google-drive": "dashboard.dataSkills.googleDrive.description",
  "google-docs": "dashboard.dataSkills.googleDocs.description",
  "file-qa": "dashboard.dataSkills.fileQa.description",
};

export function DataSkillsSection() {
  const { t } = useLocalization();
  const { status, send } = useGateway();

  const [skills, setSkills] = useState<SkillState>({
    "google-drive": false,
    "google-docs": false,
    "file-qa": false,
  });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingSkill, setSavingSkill] = useState<SkillId | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "connected") {
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoadError(null);
      try {
        const service = createGatewayConfigService(send);
        const snapshot = await service.load();
        if (cancelled) {
          return;
        }
        setSkills(readSkillsFromEntries(snapshot.normalized.skills.entries));
      } catch {
        if (cancelled) {
          return;
        }
        setLoadError(t("dashboard.dataSkills.loadError"));
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [status, send, t]);

  const handleToggle = async (skillId: SkillId) => {
    const nextEnabled = !skills[skillId];
    setSavingSkill(skillId);
    setSaveError(null);

    try {
      const service = createGatewayConfigService(send);
      const operations: ConfigPatchOperation[] = [
        {
          op: "set",
          path: ["skills", "entries", skillId],
          value: { enabled: nextEnabled },
        },
      ];
      const snapshot = await service.update(operations);
      setSkills(readSkillsFromEntries(snapshot.normalized.skills.entries));
    } catch {
      setSaveError(t("dashboard.dataSkills.saveError"));
    } finally {
      setSavingSkill(null);
    }
  };

  const hasAnySource = skills["google-drive"] || skills["google-docs"];

  return (
    <section aria-label={t("dashboard.dataSkills.sectionTitle")}>
      <div className="mb-3">
        <h2 className="text-base font-semibold text-foreground">
          {t("dashboard.dataSkills.sectionTitle")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("dashboard.dataSkills.sectionSubtitle")}
        </p>
      </div>

      {loadError ? (
        <p className="mb-3 text-sm text-destructive">{loadError}</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        {SKILL_IDS.map((skillId) => {
          const Icon = SKILL_ICONS[skillId];
          const enabled = skills[skillId];
          const isSaving = savingSkill === skillId;
          const showPrerequisite = skillId === "file-qa" && !hasAnySource;

          return (
            <Card
              key={skillId}
              className={`border transition-colors ${
                enabled
                  ? "border-primary/40 bg-primary/[0.04]"
                  : "border-border/80 bg-card/90"
              }`}
            >
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 rounded-md p-1.5 ${
                      enabled
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {t(SKILL_TITLE_KEYS[skillId])}
                      </p>
                      <span
                        className={`inline-block h-1.5 w-1.5 rounded-full ${
                          enabled
                            ? "bg-green-500"
                            : "bg-muted-foreground/50"
                        }`}
                        aria-hidden="true"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {enabled
                        ? t("dashboard.dataSkills.status.configured")
                        : t("dashboard.dataSkills.status.notConfigured")}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  {t(SKILL_DESCRIPTION_KEYS[skillId])}
                </p>

                {showPrerequisite ? (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    {t("dashboard.dataSkills.fileQa.prerequisiteNote")}
                  </p>
                ) : null}

                <Button
                  type="button"
                  size="sm"
                  variant={enabled ? "outline" : "default"}
                  onClick={() => void handleToggle(skillId)}
                  disabled={isSaving || status !== "connected"}
                  className="self-start"
                >
                  {isSaving
                    ? t("dashboard.dataSkills.saving")
                    : enabled
                      ? t("dashboard.dataSkills.action.disable")
                      : t("dashboard.dataSkills.action.enable")}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {saveError ? (
        <p className="mt-2 text-sm text-destructive">{saveError}</p>
      ) : null}
    </section>
  );
}
