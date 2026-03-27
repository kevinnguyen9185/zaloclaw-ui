"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button, buttonVariants } from "@/components/ui/button";
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
import {
  OPENROUTER_KEY_SAVED_MESSAGE,
  OPENROUTER_SIGNUP_URL,
  sanitizeOpenRouterMessage,
  validateOpenRouterApiKey,
} from "@/lib/openrouter";
import { cn } from "@/lib/utils";
import {
  findModelOptionByIdentifier,
  type ModelOption,
  resolveSelectedModelId,
} from "./selection";
import { loadModelStepState, saveModelSelection } from "./config-service";

export default function OnboardingModelPage() {
  const router = useRouter();
  const { status, send } = useGateway();
  const { state, setModel, setStep } = useOnboarding();
  const { t } = useLocalization();

  const [models, setModels] = useState<ModelOption[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(state.model ?? "");
  const [openRouterKey, setOpenRouterKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingSelection, setSavingSelection] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [saveKeyError, setSaveKeyError] = useState<string | null>(null);
  const [saveKeySuccess, setSaveKeySuccess] = useState<string | null>(null);

  const selected = useMemo(
    () => findModelOptionByIdentifier(models, selectedModel),
    [models, selectedModel]
  );

  const loadModels = useCallback(async () => {
    setLoading(true);
    setModelError(null);
    setConfigLoaded(false);

    try {
      const modelState = await loadModelStepState(send);
      const nextModels = modelState.models;
      const nextSelectedModel = resolveSelectedModelId({
        defaultModelId: modelState.selectedModelId,
        models: nextModels,
      });

      setModels(nextModels);
      setSelectedModel(nextSelectedModel);
      setConfigLoaded(true);

      if (nextModels.length === 0) {
        setModelError(
          "No models available from gateway. Add an OpenRouter key below, then refresh models."
        );
      }
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : "Failed to load model selection state";
      setModelError(`${message}. Click Retry to try again.`);
      setModels([]);
    } finally {
      setLoading(false);
    }
  }, [send]);

  useEffect(() => {
    if (status === "connected") {
      void loadModels();
    }
  }, [status, loadModels]);

  const canContinue =
    status === "connected" && selected !== null && !savingSelection && configLoaded;

  const handleSaveOpenRouterKey = useCallback(async () => {
    const validationError = validateOpenRouterApiKey(openRouterKey);

    if (validationError) {
      setSaveKeyError(validationError);
      setSaveKeySuccess(null);
      return;
    }

    setSavingKey(true);
    setSaveKeyError(null);
    setSaveKeySuccess(null);

    try {
      const response = await fetch("/api/gateway/openrouter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey: openRouterKey.trim() }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          payload?.error ?? `Failed to save OpenRouter key (${response.status})`
        );
      }

      setSaveKeySuccess(payload?.message ?? OPENROUTER_KEY_SAVED_MESSAGE);
      await loadModels();
    } catch (caught) {
      const message =
        caught instanceof Error
          ? sanitizeOpenRouterMessage(caught.message, openRouterKey)
          : "Failed to save OpenRouter key";
      setSaveKeyError(message);
    } finally {
      setSavingKey(false);
    }
  }, [loadModels, openRouterKey]);

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
        <div className="space-y-2 rounded-xl border border-dashed bg-background/50 p-4">
          <div className="space-y-1">
            <h3 className="font-heading text-base font-semibold">{t("onboarding.model.needKey")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("onboarding.model.needKeyDesc")}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              className={cn(buttonVariants({ variant: "outline" }))}
              href={OPENROUTER_SIGNUP_URL}
              rel="noreferrer"
              target="_blank"
            >
              {t("onboarding.model.createAccount")}
            </a>
            <Button
              type="button"
              variant={showKeyInput ? "secondary" : "outline"}
              onClick={() => setShowKeyInput((current) => !current)}
            >
              {showKeyInput ? t("onboarding.model.hideKeyForm") : t("onboarding.model.haveKey")}
            </Button>
          </div>

          {showKeyInput ? (
            <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
              <label
                className="text-sm text-muted-foreground"
                htmlFor="openrouter-api-key"
              >
                {t("onboarding.model.keyLabel")}
              </label>
              <input
                id="openrouter-api-key"
                type="password"
                value={openRouterKey}
                onChange={(event) => {
                  setOpenRouterKey(event.target.value);
                  if (saveKeyError) {
                    setSaveKeyError(null);
                  }
                }}
                placeholder="sk-or-v1-..."
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
              />
              <p className="text-xs text-muted-foreground">
                {t("onboarding.model.keyHint")}
              </p>

              {saveKeySuccess ? (
                <p className="text-sm text-emerald-600">{saveKeySuccess}</p>
              ) : null}

              {saveKeyError ? (
                <p className="text-sm text-destructive">{saveKeyError}</p>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  disabled={savingKey}
                  onClick={() => void handleSaveOpenRouterKey()}
                >
                  {savingKey ? t("onboarding.model.savingKey") : t("onboarding.model.saveKey")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading || status !== "connected"}
                  onClick={() => void loadModels()}
                >
                  {loading ? t("onboarding.model.refreshing") : t("onboarding.model.refreshModels")}
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <label className="text-sm text-muted-foreground" htmlFor="model-select">
          {t("onboarding.model.availableModels")}
        </label>
        <Select
          value={selectedModel}
          onValueChange={(value) => {
            setSelectedModel(value ?? "");
          }}
        >
          <SelectTrigger id="model-select" className="w-full">
            <SelectValue
              placeholder={loading ? t("onboarding.model.loadingModels") : t("onboarding.model.selectModel")}
            />
          </SelectTrigger>
          <SelectContent>
            {models.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.name} ({model.provider})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selected ? (
          <p className="text-sm text-muted-foreground">
            {t("onboarding.model.selected")}: <strong>{selected.name}</strong> {t("onboarding.model.by")} {selected.provider}
          </p>
        ) : null}

        {modelError ? <p className="text-sm text-destructive">{modelError}</p> : null}
      </div>

      <Separator />

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={loading || status !== "connected"}
          onClick={() => void loadModels()}
        >
          {loading ? t("onboarding.model.refreshing") : t("onboarding.model.retry")}
        </Button>
        <Button
          type="button"
          disabled={!canContinue}
          onClick={async () => {
            const modelToPersist = selected?.id ?? selectedModel.trim();
            setSavingSelection(true);
            setModelError(null);
            try {
              await saveModelSelection(send, {
                modelId: modelToPersist,
                provider: selected?.provider ?? "",
              });
              setModel(modelToPersist);
              setStep("zalo");
              router.push("/zalo");
            } catch (caught) {
              const message =
                caught instanceof Error
                  ? caught.message
                  : "Failed to persist selected model configuration";
              setModelError(`${message}. Click Retry and try again.`);
            } finally {
              setSavingSelection(false);
            }
          }}
        >
          {savingSelection ? t("onboarding.model.saving") : t("common.next")}
        </Button>
      </div>
    </section>
  );
}
