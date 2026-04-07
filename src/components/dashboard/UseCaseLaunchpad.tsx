"use client";

import React, { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { executeAssistantIdentityUpdate } from "@/lib/dashboard/assistant-identity-agent";
import { useDashboardChat } from "@/lib/dashboard/chat";
import {
  createInitialAssistantIdentityStage,
  createStarterAssistantIdentity,
  EMPTY_ASSISTANT_IDENTITY_PROFILE,
  generateAssistantIdentityDocuments,
  hasCompletedAssistantIdentityProfile,
  startAssistantIdentityFlow,
  validateAssistantIdentityProfile,
  type AssistantIdentityProfile,
  type AssistantIdentityStage,
} from "@/lib/dashboard/assistant-identity";
import {
  loadAssistantIdentityState,
  saveAssistantIdentityState,
} from "@/lib/dashboard/assistant-identity-storage";
import {
  DASHBOARD_USE_CASES,
  resolveFeaturedUseCase,
} from "@/lib/dashboard/use-cases";
import { useGateway } from "@/lib/gateway/context";
import { useLocalization } from "@/lib/i18n/context";

export function UseCaseLaunchpad() {
  const { t } = useLocalization();
  const { status, send } = useGateway();
  const {
    publishEvent,
    isConfigurationCollapsed,
    focusChatMode,
    reopenConfiguration,
    setBotName,
    updateIdentityProfile,
  } = useDashboardChat();
  const featured = resolveFeaturedUseCase(DASHBOARD_USE_CASES);
  const [stage, setStage] = useState<AssistantIdentityStage>("intro");
  const [profile, setProfile] = useState<AssistantIdentityProfile>(
    EMPTY_ASSISTANT_IDENTITY_PROFILE
  );
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof AssistantIdentityProfile, string>>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUseCaseCollapsed, setIsUseCaseCollapsed] = useState(false);
  const [pendingFocusTarget, setPendingFocusTarget] = useState<"reopen" | "form" | null>(null);

  const reopenButtonRef = useRef<HTMLButtonElement | null>(null);
  const assistantNameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const stored = loadAssistantIdentityState();
    setProfile(stored.profile);
    setStage(createInitialAssistantIdentityStage(stored.profile));
    if (stored.documents && hasCompletedAssistantIdentityProfile(stored.profile)) {
      setIsUseCaseCollapsed(true);
    }
  }, []);

  useEffect(() => {
    if (pendingFocusTarget === "reopen" && isConfigurationCollapsed) {
      reopenButtonRef.current?.focus();
      setPendingFocusTarget(null);
    }
  }, [pendingFocusTarget, isConfigurationCollapsed]);

  useEffect(() => {
    if (pendingFocusTarget === "form" && !isConfigurationCollapsed) {
      assistantNameInputRef.current?.focus();
      setPendingFocusTarget(null);
    }
  }, [pendingFocusTarget, isConfigurationCollapsed]);

  if (!featured) {
    return (
      <Card className="animate-card-enter-3 border border-dashed border-border/80 bg-card/70">
        <CardHeader>
          <CardTitle className="text-base">{t("dashboard.launchpad.title")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{t("dashboard.launchpad.empty")}</p>
        </CardContent>
      </Card>
    );
  }

  const updateField = (field: keyof AssistantIdentityProfile, value: string) => {
    setProfile((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
    setStatusMessage(null);
  };

  const guessTimezone = () => {
    if (profile.timezone.trim().length > 0) {
      return profile.timezone;
    }

    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  };

  const handleSuggest = () => {
    setProfile((current) => createStarterAssistantIdentity(current, guessTimezone()));
    setFieldErrors({});
    setStage("questions");
    setStatusMessage(t("dashboard.identity.suggestionApplied"));
    publishEvent({
      type: "action-triggered",
      route: "dashboard",
      action: "identity.suggestStarter",
    });
  };

  const handleSave = async () => {
    const nextProfile = {
      ...profile,
      timezone: profile.timezone.trim() || guessTimezone(),
    };
    const errors = validateAssistantIdentityProfile(nextProfile);

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setStatusMessage(t("dashboard.identity.validationSummary"));
      return;
    }

    if (status !== "connected") {
      setStatusMessage(t("dashboard.identity.gatewayRequired"));
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      const generatedDocuments = generateAssistantIdentityDocuments(nextProfile);
      await executeAssistantIdentityUpdate(send, nextProfile, generatedDocuments);

      setProfile(nextProfile);
      saveAssistantIdentityState({ profile: nextProfile, documents: generatedDocuments });
      setBotName(nextProfile.assistantName);
      updateIdentityProfile(nextProfile);
      setIsUseCaseCollapsed(true);
      setStatusMessage(t("dashboard.identity.saveSuccess"));
      setPendingFocusTarget("reopen");
      focusChatMode();
      publishEvent({
        type: "save-succeeded",
        route: "dashboard",
        action: "identity.generateFiles",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("dashboard.identity.saveError");
      setStatusMessage(message);
      publishEvent({
        type: "save-failed",
        route: "dashboard",
        action: "identity.generateFiles",
        message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCollapseConfiguration = () => {
    setPendingFocusTarget("reopen");
    focusChatMode();
    setStatusMessage(t("dashboard.identity.configCollapsed"));
    publishEvent({
      type: "action-triggered",
      route: "dashboard",
      action: "identity.collapseConfig",
    });
  };

  const handleReopenConfiguration = () => {
    setPendingFocusTarget("form");
    reopenConfiguration();
    setStatusMessage(t("dashboard.identity.configReopened"));
    publishEvent({
      type: "action-triggered",
      route: "dashboard",
      action: "identity.reopenConfig",
    });
  };

  const showConfigurationForm = !isConfigurationCollapsed;
  const hasIdentitySummary = hasCompletedAssistantIdentityProfile(profile);

  if (isUseCaseCollapsed) {
    return (
      <section className="space-y-4 animate-card-enter-3" aria-labelledby="use-cases-heading">
        <header className="space-y-1">
          <h2 id="use-cases-heading" className="font-heading text-xl font-semibold">
            {t("dashboard.launchpad.title")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("dashboard.launchpad.collapsedSummary")}</p>
        </header>

        <Card className="border border-dashed border-primary/40 bg-primary/[0.04]">
          <CardContent className="flex items-center justify-between gap-3 pt-6">
            <p className="text-sm text-muted-foreground">{t("dashboard.launchpad.collapsedHint")}</p>
            <Button type="button" variant="outline" onClick={() => setIsUseCaseCollapsed(false)}>
              {t("dashboard.launchpad.reopen")}
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-4 animate-card-enter-3" aria-labelledby="use-cases-heading">
      <header className="space-y-1">
        <h2 id="use-cases-heading" className="font-heading text-xl font-semibold">
          {t("dashboard.launchpad.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("dashboard.launchpad.subtitle")}
        </p>
      </header>

      <Card className="border border-border/80 bg-card/90">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">{t("dashboard.identity.summaryTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {hasIdentitySummary ? (
            <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <p>
                <span className="font-medium text-foreground">{t("dashboard.identity.summaryName")}: </span>
                {profile.assistantName}
              </p>
              <p>
                <span className="font-medium text-foreground">{t("dashboard.identity.summaryType")}: </span>
                {profile.creatureType}
              </p>
              <p className="sm:col-span-2">
                <span className="font-medium text-foreground">{t("dashboard.identity.summaryVibe")}: </span>
                {profile.vibe}
              </p>
              <p>
                <span className="font-medium text-foreground">{t("dashboard.identity.summaryTimezone")}: </span>
                {profile.timezone}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("dashboard.identity.summaryIncomplete")}</p>
          )}
        </CardContent>
      </Card>

      {stage === "intro" ? (
        <Card className="border border-primary/30 bg-primary/[0.06]">
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] text-primary/80">
              <span className="rounded-full border border-border/80 bg-background px-2 py-1">
                {t("dashboard.card.effort.quick")}
              </span>
              <span>{t("dashboard.card.featured")}</span>
            </div>
            <CardTitle className="text-lg">{t(featured.titleKey)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t(featured.outcomeKey)}
            </p>
            <ul className="flex flex-wrap gap-1.5" aria-label={t("dashboard.launchpad.title") + " tags"}>
              {featured.tagKeys.map((tagKey) => (
                <li key={tagKey}>
                  <span className="rounded-full border border-border/80 bg-muted/60 px-2 py-0.5 text-xs text-foreground">
                    {t(tagKey)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={() => setStage(startAssistantIdentityFlow())}>
                {t("dashboard.usecase.start")}
              </Button>
              <Button type="button" variant="outline" onClick={handleSuggest}>
                {t("dashboard.identity.suggestAction")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {showConfigurationForm ? (
            <Card className="border border-border/80 bg-card/90">
              <CardHeader className="space-y-2">
                <CardTitle className="text-lg">{t("dashboard.identity.title")}</CardTitle>
                <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                  <p>{t("dashboard.identity.intro")}</p>
                  <p>{t("dashboard.identity.assistantBlock")}</p>
                  <p>{t("dashboard.identity.userBlock")}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-foreground">{t("dashboard.identity.assistantName")}</span>
                  <input
                    ref={assistantNameInputRef}
                    className="w-full rounded-md border bg-background px-3 py-2 outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    value={profile.assistantName}
                    onChange={(event) => updateField("assistantName", event.target.value)}
                    placeholder={t("dashboard.identity.assistantNamePlaceholder")}
                  />
                  {fieldErrors.assistantName ? (
                    <span className="text-xs text-destructive">{t("dashboard.identity.requiredField")}</span>
                  ) : null}
                </label>

                <label className="space-y-1 text-sm">
                  <span className="font-medium text-foreground">{t("dashboard.identity.creatureType")}</span>
                  <input
                    className="w-full rounded-md border bg-background px-3 py-2 outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    value={profile.creatureType}
                    onChange={(event) => updateField("creatureType", event.target.value)}
                    placeholder={t("dashboard.identity.creatureTypePlaceholder")}
                  />
                  {fieldErrors.creatureType ? (
                    <span className="text-xs text-destructive">{t("dashboard.identity.requiredField")}</span>
                  ) : null}
                </label>

                <label className="space-y-1 text-sm sm:col-span-2">
                  <span className="font-medium text-foreground">{t("dashboard.identity.vibe")}</span>
                  <textarea
                    className="min-h-24 w-full rounded-md border bg-background px-3 py-2 outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    value={profile.vibe}
                    onChange={(event) => updateField("vibe", event.target.value)}
                    placeholder={t("dashboard.identity.vibePlaceholder")}
                  />
                  {fieldErrors.vibe ? (
                    <span className="text-xs text-destructive">{t("dashboard.identity.requiredField")}</span>
                  ) : null}
                </label>

                <label className="space-y-1 text-sm">
                  <span className="font-medium text-foreground">{t("dashboard.identity.emoji")}</span>
                  <input
                    className="w-full rounded-md border bg-background px-3 py-2 outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    value={profile.emoji}
                    onChange={(event) => updateField("emoji", event.target.value)}
                    placeholder={t("dashboard.identity.emojiPlaceholder")}
                  />
                  {fieldErrors.emoji ? (
                    <span className="text-xs text-destructive">{t("dashboard.identity.requiredField")}</span>
                  ) : null}
                </label>

                <label className="space-y-1 text-sm">
                  <span className="font-medium text-foreground">{t("dashboard.identity.userName")}</span>
                  <input
                    className="w-full rounded-md border bg-background px-3 py-2 outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    value={profile.userName}
                    onChange={(event) => updateField("userName", event.target.value)}
                    placeholder={t("dashboard.identity.userNamePlaceholder")}
                  />
                  {fieldErrors.userName ? (
                    <span className="text-xs text-destructive">{t("dashboard.identity.requiredField")}</span>
                  ) : null}
                </label>

                <label className="space-y-1 text-sm sm:col-span-2">
                  <span className="font-medium text-foreground">{t("dashboard.identity.timezone")}</span>
                  <input
                    className="w-full rounded-md border bg-background px-3 py-2 outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    value={profile.timezone}
                    onChange={(event) => updateField("timezone", event.target.value)}
                    placeholder={t("dashboard.identity.timezonePlaceholder")}
                  />
                  {fieldErrors.timezone ? (
                    <span className="text-xs text-destructive">{t("dashboard.identity.requiredField")}</span>
                  ) : null}
                </label>
                </div>

                {statusMessage ? <p className="text-sm text-muted-foreground">{statusMessage}</p> : null}

                <div className="flex flex-wrap gap-3">
                  <Button type="button" variant="outline" onClick={handleSuggest}>
                    {t("dashboard.identity.suggestAction")}
                  </Button>
                  <Button type="button" variant="ghost" onClick={handleCollapseConfiguration}>
                    {t("dashboard.identity.collapseConfig")}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={isSaving || status !== "connected"}
                  >
                    {isSaving ? t("dashboard.identity.saving") : t("dashboard.identity.saveAction")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-dashed border-primary/40 bg-primary/[0.04]">
              <CardHeader className="space-y-2">
                <CardTitle className="text-base">{t("dashboard.identity.configCollapsedTitle")}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.identity.configCollapsedHint")}
                </p>
              </CardHeader>
              <CardContent>
                <Button
                  ref={reopenButtonRef}
                  type="button"
                  variant="outline"
                  onClick={handleReopenConfiguration}
                >
                  {t("dashboard.identity.reopenConfig")}
                </Button>
              </CardContent>
            </Card>
          )}


        </div>
      )}
    </section>
  );
}
