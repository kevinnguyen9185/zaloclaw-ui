"use client";

import { Button } from "@/components/ui/button";
import type { ServiceName } from "@/lib/status/types";
import { useLocalization } from "@/lib/i18n/context";

type RecoveryDialogProps = {
  service: ServiceName | null;
  onDismiss: () => void;
  onRetry: () => Promise<void>;
};

export function RecoveryDialog({ service, onDismiss, onRetry }: RecoveryDialogProps) {
  const { t } = useLocalization();

  if (!service) {
    return null;
  }

  const label = service === "openclaw" ? t("common.openclaw") : t("common.zalo");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-lg border bg-background p-5 shadow-lg">
        <h3 className="text-base font-semibold">{t("common.recoveryTitle")}</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("common.recoveryDescription").replace("{service}", label)}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {service === "zalo" ? (
            <Button type="button" variant="secondary" onClick={() => (window.location.href = "/zalo")}>
              {t("dashboard.zalo.connectAction")}
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => (window.location.href = "/settings")}>
                {t("common.reconfigure")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  void onRetry();
                }}
              >
                {t("common.retry")}
              </Button>
            </>
          )}
          <Button type="button" variant="ghost" onClick={onDismiss}>
            {t("common.dismiss")}
          </Button>
        </div>
      </div>
    </div>
  );
}
