export const SUPPORTED_LOCALES = ["vi", "en"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export type LocaleNamespace = "common" | "dashboard" | "onboarding" | "settings";

export type LocaleDictionary = Record<string, string>;

export type LocaleResources = Record<LocaleNamespace, LocaleDictionary>;

export const DEFAULT_LOCALE: Locale = "vi";
export const LOCALE_STORAGE_KEY = "zaloclaw.locale.v1";
