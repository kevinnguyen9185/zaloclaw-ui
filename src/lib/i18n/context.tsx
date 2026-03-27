"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { RESOURCES } from "@/lib/i18n/resources";
import { isLocale, translate } from "@/lib/i18n/translate";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  type Locale,
} from "@/lib/i18n/types";

type LocalizationContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  availableLocales: readonly Locale[];
  t: (key: string) => string;
};

const LocalizationContext = createContext<LocalizationContextValue | null>(null);

function loadInitialLocale(): Locale {
  if (typeof window === "undefined") {
    return DEFAULT_LOCALE;
  }

  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored && isLocale(stored)) {
    return stored;
  }

  return DEFAULT_LOCALE;
}

export function LocalizationProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    setLocaleState(loadInitialLocale());
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
  }, []);

  const t = useCallback(
    (key: string) => {
      if (process.env.NODE_ENV !== "production") {
        const [ns, ...rest] = key.split(".");
        if (!ns || rest.length === 0) {
          return key;
        }
        if (!(ns in RESOURCES[DEFAULT_LOCALE])) {
          return key;
        }
      }
      return translate(locale, key);
    },
    [locale]
  );

  const value = useMemo<LocalizationContextValue>(
    () => ({
      locale,
      setLocale,
      availableLocales: SUPPORTED_LOCALES,
      t,
    }),
    [locale, setLocale, t]
  );

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization(): LocalizationContextValue {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error("useLocalization must be used within LocalizationProvider");
  }
  return context;
}
