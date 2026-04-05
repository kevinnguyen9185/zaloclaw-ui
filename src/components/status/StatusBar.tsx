"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { StatusIndicator } from "@/components/status/StatusIndicator";
import { useConnectionStatus } from "@/lib/status/context";
import { useLocalization } from "@/lib/i18n/context";

export function StatusBar() {
  const { t } = useLocalization();
  const { snapshot, checkNow } = useConnectionStatus();
  const [checkingNow, setCheckingNow] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <StatusIndicator service="openclaw" status={snapshot.openclaw} />
      <StatusIndicator service="zalo" status={snapshot.zalo} />
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={snapshot.isChecking || checkingNow}
        onClick={async () => {
          setCheckingNow(true);
          await checkNow();
          setCheckingNow(false);
        }}
      >
        {snapshot.isChecking || checkingNow ? t("common.checking") : t("common.checkNow")}
      </Button>
    </div>
  );
}
