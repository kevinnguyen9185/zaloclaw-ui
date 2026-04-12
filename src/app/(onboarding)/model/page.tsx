"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useGateway } from "@/lib/gateway/context";
import { useLocalization } from "@/lib/i18n/context";
import { useOnboarding } from "@/lib/onboarding/context";
import { loadModelStepState, saveModelSelection } from "./config-service";
import { formatModelOptionLabel, type ModelOption } from "./selection";

export default function OnboardingModelPage() {
  const router = useRouter();
  const { status, send } = useGateway();
  const { setModel, setStep } = useOnboarding();
  const { t } = useLocalization();

  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);
  const [selectedModelId, setSelectedModelId] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingSelection, setSavingSelection] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Set the current step when the page loads
  useEffect(() => {
    setStep("model");
  }, [setStep]);

  const loadStepState = useCallback(async () => {
    setLoading(true);
    setModelError(null);
    setConfigLoaded(false);

    try {
      const modelState = await loadModelStepState(send);
      setModelOptions(modelState.modelOptions);
      setSelectedModelId(modelState.selectedModelId);
      setSaveSuccess(null);
      setConfigLoaded(true);
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : "Failed to load model selection state";
      setModelError(`${message}. Refresh the page and try again.`);
    } finally {
      setLoading(false);
    }
  }, [send]);

  useEffect(() => {
    if (status === "connected") {
      void loadStepState();
    }
  }, [status, loadStepState]);

  const normalizedModelId = selectedModelId.trim();
  const hasSelectableModels = modelOptions.length > 0;

  const canSave =
    status === "connected" &&
    !loading &&
    !savingSelection &&
    configLoaded &&
    hasSelectableModels &&
    normalizedModelId.length > 0;

  const persistSelection = useCallback(async () => {
    const modelToPersist = normalizedModelId;
    setSavingSelection(true);
    setModelError(null);

    try {
      const updatedConfig = await saveModelSelection(send, {
        primaryModel: modelToPersist,
      });
      const persistedPrimaryModel =
        updatedConfig.normalized.agents.defaults.model.primary ?? modelToPersist;

      setSelectedModelId(persistedPrimaryModel);
      setModel(persistedPrimaryModel);
      setSaveSuccess(t("onboarding.model.saveSuccess"));

      return persistedPrimaryModel;
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : "Failed to persist selected model configuration";
      setModelError(`${message}. ${t("onboarding.model.saveFailed")}`);
      return null;
    } finally {
      setSavingSelection(false);
    }
  }, [normalizedModelId, send, setModel, t]);

  return (
    <section className="space-y-5">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-primary/90">
          {t("onboarding.model.eyebrow")}
        </p>
        <h2 className="font-heading text-2xl font-semibold text-foreground sm:text-[1.75rem]">
          {t("onboarding.model.title")}
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t("onboarding.model.subtitle")}
        </p>
      </header>

      <div className="space-y-3 rounded-xl border bg-card/80 p-4">
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground" htmlFor="primary-model-select">
            {t("onboarding.model.selectedModel")}
          </label>
          <Select
            value={selectedModelId}
            disabled={loading || !hasSelectableModels || status !== "connected"}
            onValueChange={(value) => {
              setSelectedModelId(value ?? "");
              setModelError(null);
              setSaveSuccess(null);
            }}
          >
            <SelectTrigger id="primary-model-select" className="w-full">
              <SelectValue placeholder={t("onboarding.model.selectModel")} />
            </SelectTrigger>
            <SelectContent>
              {modelOptions.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {formatModelOptionLabel(model)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="text-xs text-muted-foreground">{t("onboarding.model.modelNameHint")}</p>

        {loading ? (
          <p className="text-sm text-muted-foreground">{t("onboarding.model.refreshing")}</p>
        ) : null}

        {!loading && configLoaded && !hasSelectableModels && !modelError ? (
          <p className="text-sm text-muted-foreground">{t("onboarding.model.emptyState")}</p>
        ) : null}

        {saveSuccess ? <p className="text-sm text-emerald-600">{saveSuccess}</p> : null}

        {modelError ? <p className="text-sm text-destructive">{modelError}</p> : null}
      </div>

      <Separator />

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={!canSave}
          onClick={() => void persistSelection()}
        >
          {savingSelection ? t("onboarding.model.saving") : t("common.save")}
        </Button>

        <Button
          type="button"
          disabled={!canSave}
          onClick={async () => {
            const persistedPrimaryModel = await persistSelection();
            if (!persistedPrimaryModel) {
              return;
            }

            setStep("zalo");
            router.push("/zalo");
          }}
        >
          {savingSelection ? t("onboarding.model.saving") : t("common.next")}
        </Button>
      </div>
    </section>
  );
}
