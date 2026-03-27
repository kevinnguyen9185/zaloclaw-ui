import type { ThemeName, ThemePalette, ThemeTokens } from "@/lib/theme/types";

const BASE_LIGHT: ThemeTokens = {
  "--background": "oklch(1 0 0)",
  "--foreground": "oklch(0.145 0 0)",
  "--card": "oklch(1 0 0)",
  "--card-foreground": "oklch(0.145 0 0)",
  "--popover": "oklch(1 0 0)",
  "--popover-foreground": "oklch(0.145 0 0)",
  // Zalo blue primary — restrained to CTAs, active states, and key highlights
  "--primary": "oklch(0.56 0.18 210)",
  "--primary-foreground": "oklch(0.985 0 0)",
  "--secondary": "oklch(0.97 0 0)",
  "--secondary-foreground": "oklch(0.205 0 0)",
  "--muted": "oklch(0.97 0 0)",
  "--muted-foreground": "oklch(0.556 0 0)",
  "--accent": "oklch(0.97 0 0)",
  "--accent-foreground": "oklch(0.205 0 0)",
  "--destructive": "oklch(0.577 0.245 27.325)",
  "--border": "oklch(0.922 0 0)",
  "--input": "oklch(0.922 0 0)",
  "--ring": "oklch(0.68 0.14 210)",
  "--chart-1": "oklch(0.87 0 0)",
  "--chart-2": "oklch(0.556 0 0)",
  "--chart-3": "oklch(0.439 0 0)",
  "--chart-4": "oklch(0.371 0 0)",
  "--chart-5": "oklch(0.269 0 0)",
  "--radius": "0.625rem",
  "--sidebar": "oklch(0.985 0 0)",
  "--sidebar-foreground": "oklch(0.145 0 0)",
  "--sidebar-primary": "oklch(0.56 0.18 210)",
  "--sidebar-primary-foreground": "oklch(0.985 0 0)",
  "--sidebar-accent": "oklch(0.97 0 0)",
  "--sidebar-accent-foreground": "oklch(0.205 0 0)",
  "--sidebar-border": "oklch(0.922 0 0)",
  "--sidebar-ring": "oklch(0.68 0.14 210)",
};

const BASE_DARK: ThemeTokens = {
  "--background": "oklch(0.145 0 0)",
  "--foreground": "oklch(0.985 0 0)",
  "--card": "oklch(0.205 0 0)",
  "--card-foreground": "oklch(0.985 0 0)",
  "--popover": "oklch(0.205 0 0)",
  "--popover-foreground": "oklch(0.985 0 0)",
  "--primary": "oklch(0.922 0 0)",
  "--primary-foreground": "oklch(0.205 0 0)",
  "--secondary": "oklch(0.269 0 0)",
  "--secondary-foreground": "oklch(0.985 0 0)",
  "--muted": "oklch(0.269 0 0)",
  "--muted-foreground": "oklch(0.708 0 0)",
  "--accent": "oklch(0.269 0 0)",
  "--accent-foreground": "oklch(0.985 0 0)",
  "--destructive": "oklch(0.704 0.191 22.216)",
  "--border": "oklch(1 0 0 / 10%)",
  "--input": "oklch(1 0 0 / 15%)",
  "--ring": "oklch(0.556 0 0)",
  "--chart-1": "oklch(0.87 0 0)",
  "--chart-2": "oklch(0.556 0 0)",
  "--chart-3": "oklch(0.439 0 0)",
  "--chart-4": "oklch(0.371 0 0)",
  "--chart-5": "oklch(0.269 0 0)",
  "--sidebar": "oklch(0.205 0 0)",
  "--sidebar-foreground": "oklch(0.985 0 0)",
  "--sidebar-primary": "oklch(0.488 0.243 264.376)",
  "--sidebar-primary-foreground": "oklch(0.985 0 0)",
  "--sidebar-accent": "oklch(0.269 0 0)",
  "--sidebar-accent-foreground": "oklch(0.985 0 0)",
  "--sidebar-border": "oklch(1 0 0 / 10%)",
  "--sidebar-ring": "oklch(0.556 0 0)",
};

function withHue(base: ThemeTokens, hue: number, mode: "light" | "dark"): ThemeTokens {
  const lightness = mode === "light" ? 0.58 : 0.76;
  const chroma = mode === "light" ? 0.18 : 0.14;

  return {
    ...base,
    "--primary": `oklch(${lightness} ${chroma} ${hue})`,
    "--primary-foreground":
      mode === "light" ? "oklch(0.985 0 0)" : "oklch(0.205 0 0)",
    "--ring": `oklch(${mode === "light" ? 0.67 : 0.72} ${Math.max(chroma - 0.04, 0.05)} ${hue})`,
    "--sidebar-primary": `oklch(${lightness} ${chroma} ${hue})`,
  };
}

const PALETTES: Record<ThemeName, ThemePalette> = {
  zinc: {
    light: { ...BASE_LIGHT },
    dark: { ...BASE_DARK },
  },
  slate: {
    light: withHue(BASE_LIGHT, 240, "light"),
    dark: withHue(BASE_DARK, 240, "dark"),
  },
  stone: {
    light: withHue(BASE_LIGHT, 70, "light"),
    dark: withHue(BASE_DARK, 70, "dark"),
  },
  rose: {
    light: withHue(BASE_LIGHT, 20, "light"),
    dark: withHue(BASE_DARK, 20, "dark"),
  },
  violet: {
    light: withHue(BASE_LIGHT, 300, "light"),
    dark: withHue(BASE_DARK, 300, "dark"),
  },
  sky: {
    light: withHue(BASE_LIGHT, 210, "light"),
    dark: withHue(BASE_DARK, 210, "dark"),
  },
  emerald: {
    light: withHue(BASE_LIGHT, 165, "light"),
    dark: withHue(BASE_DARK, 165, "dark"),
  },
};

export const THEME_PALETTES = PALETTES;
