import commonEn from "@/locales/en/common.json";
import dashboardEn from "@/locales/en/dashboard.json";
import onboardingEn from "@/locales/en/onboarding.json";
import settingsEn from "@/locales/en/settings.json";
import commonVi from "@/locales/vi/common.json";
import dashboardVi from "@/locales/vi/dashboard.json";
import onboardingVi from "@/locales/vi/onboarding.json";
import settingsVi from "@/locales/vi/settings.json";
import type { Locale, LocaleResources } from "@/lib/i18n/types";

export const RESOURCES: Record<Locale, LocaleResources> = {
  vi: {
    common: commonVi,
    dashboard: dashboardVi,
    onboarding: onboardingVi,
    settings: settingsVi,
  },
  en: {
    common: commonEn,
    dashboard: dashboardEn,
    onboarding: onboardingEn,
    settings: settingsEn,
  },
};
