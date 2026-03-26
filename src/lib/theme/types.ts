export const THEME_NAMES = [
  "zinc",
  "slate",
  "stone",
  "rose",
  "violet",
  "sky",
  "emerald",
] as const;

export type ThemeName = (typeof THEME_NAMES)[number];
export type ThemeMode = "light" | "dark" | "system";
export type ResolvedThemeMode = "light" | "dark";

export type ThemeTokens = Record<string, string>;

export type ThemePalette = {
  light: ThemeTokens;
  dark: ThemeTokens;
};

export type ThemePreference = {
  theme: ThemeName;
  mode: ThemeMode;
  accentHue: number | null;
};

export const DEFAULT_THEME_PREFERENCE: ThemePreference = {
  theme: "zinc",
  mode: "system",
  accentHue: null,
};
