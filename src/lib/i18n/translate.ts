import { RESOURCES } from "@/lib/i18n/resources";
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type Locale,
  type LocaleNamespace,
} from "@/lib/i18n/types";

export function isLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function translate(locale: Locale, key: string): string {
  const [namespace, ...pathParts] = key.split(".");
  if (!namespace || pathParts.length === 0) {
    return key;
  }

  const path = pathParts.join(".");
  const ns = namespace as LocaleNamespace;

  const localized = RESOURCES[locale]?.[ns]?.[path];
  if (localized) {
    return localized;
  }

  const fallback = RESOURCES[DEFAULT_LOCALE]?.[ns]?.[path];
  if (fallback) {
    return fallback;
  }

  return key;
}
