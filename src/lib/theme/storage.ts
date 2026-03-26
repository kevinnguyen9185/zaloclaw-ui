import { THEME_PALETTES } from "@/lib/theme/themes";
import {
  DEFAULT_THEME_PREFERENCE,
  type ThemeMode,
  type ThemeName,
  type ThemePreference,
} from "@/lib/theme/types";

export const THEME_STORAGE_KEY = "zaloclaw.theme.v1";

function isThemeName(value: unknown): value is ThemeName {
  return typeof value === "string" && value in THEME_PALETTES;
}

function isThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

function normalizeAccentHue(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  const normalized = value % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

export function loadThemePreference(): ThemePreference {
  if (typeof window === "undefined") {
    return DEFAULT_THEME_PREFERENCE;
  }

  const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (!raw) {
    return DEFAULT_THEME_PREFERENCE;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ThemePreference>;

    return {
      theme: isThemeName(parsed.theme)
        ? parsed.theme
        : DEFAULT_THEME_PREFERENCE.theme,
      mode: isThemeMode(parsed.mode) ? parsed.mode : DEFAULT_THEME_PREFERENCE.mode,
      accentHue: normalizeAccentHue(parsed.accentHue),
    };
  } catch {
    return DEFAULT_THEME_PREFERENCE;
  }
}

export function saveThemePreference(preference: ThemePreference): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(preference));
}
