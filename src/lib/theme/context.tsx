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

import { applyTheme, resolveThemeMode } from "@/lib/theme/engine";
import { loadThemePreference, saveThemePreference } from "@/lib/theme/storage";
import {
  DEFAULT_THEME_PREFERENCE,
  type ResolvedThemeMode,
  type ThemeMode,
  type ThemeName,
  type ThemePreference,
} from "@/lib/theme/types";

type ThemeContextValue = {
  theme: ThemeName;
  mode: ThemeMode;
  resolvedMode: ResolvedThemeMode;
  accentHue: number | null;
  setTheme: (theme: ThemeName) => void;
  setAccent: (hue: number | null) => void;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemMode(): ResolvedThemeMode {
  if (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  return "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(
    DEFAULT_THEME_PREFERENCE
  );
  const [resolvedMode, setResolvedMode] =
    useState<ResolvedThemeMode>("light");

  useEffect(() => {
    const initial = loadThemePreference();
    setPreference(initial);
    setResolvedMode(applyTheme(initial));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      setResolvedMode((current) => {
        if (preference.mode !== "system") {
          return current;
        }

        const nextResolved = resolveThemeMode("system", media.matches);
        applyTheme(preference, { prefersDark: media.matches });
        return nextResolved;
      });
    };

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [preference]);

  const updatePreference = useCallback((next: ThemePreference) => {
    setPreference(next);
    saveThemePreference(next);
    setResolvedMode(applyTheme(next));
  }, []);

  const setTheme = useCallback(
    (theme: ThemeName) => {
      updatePreference({
        ...preference,
        theme,
      });
    },
    [preference, updatePreference]
  );

  const setAccent = useCallback(
    (accentHue: number | null) => {
      updatePreference({
        ...preference,
        accentHue,
      });
    },
    [preference, updatePreference]
  );

  const setMode = useCallback(
    (mode: ThemeMode) => {
      updatePreference({
        ...preference,
        mode,
      });
    },
    [preference, updatePreference]
  );

  const toggleMode = useCallback(() => {
    const effective =
      preference.mode === "system" ? getSystemMode() : preference.mode;

    updatePreference({
      ...preference,
      mode: effective === "dark" ? "light" : "dark",
    });
  }, [preference, updatePreference]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: preference.theme,
      mode: preference.mode,
      resolvedMode,
      accentHue: preference.accentHue,
      setTheme,
      setAccent,
      setMode,
      toggleMode,
    }),
    [preference, resolvedMode, setTheme, setAccent, setMode, toggleMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
