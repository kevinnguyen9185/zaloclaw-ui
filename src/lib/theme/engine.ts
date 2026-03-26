import { THEME_PALETTES } from "@/lib/theme/themes";
import type {
  ResolvedThemeMode,
  ThemeMode,
  ThemePreference,
  ThemeTokens,
} from "@/lib/theme/types";

type ThemeApplyEnv = {
  doc?: Document;
  prefersDark?: boolean;
};

export function resolveThemeMode(
  mode: ThemeMode,
  prefersDark: boolean
): ResolvedThemeMode {
  if (mode === "system") {
    return prefersDark ? "dark" : "light";
  }

  return mode;
}

function clampHue(value: number): number {
  if (!Number.isFinite(value)) {
    return 210;
  }

  const normalized = value % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

export function deriveAccentTokens(
  hue: number,
  mode: ResolvedThemeMode
): ThemeTokens {
  const safeHue = clampHue(hue);
  const chroma = mode === "light" ? 0.18 : 0.14;
  const primaryLightness = mode === "light" ? 0.56 : 0.76;
  const ringLightness = mode === "light" ? 0.68 : 0.72;

  return {
    "--primary": `oklch(${primaryLightness} ${chroma} ${safeHue})`,
    "--primary-foreground":
      mode === "light" ? "oklch(0.985 0 0)" : "oklch(0.205 0 0)",
    "--ring": `oklch(${ringLightness} ${Math.max(chroma - 0.04, 0.05)} ${safeHue})`,
    "--sidebar-primary": `oklch(${primaryLightness} ${chroma} ${safeHue})`,
  };
}

export function getThemeTokens(
  preference: ThemePreference,
  mode: ResolvedThemeMode
): ThemeTokens {
  const palette = THEME_PALETTES[preference.theme][mode];

  if (preference.accentHue === null) {
    return palette;
  }

  return {
    ...palette,
    ...deriveAccentTokens(preference.accentHue, mode),
  };
}

export function applyTheme(
  preference: ThemePreference,
  env?: ThemeApplyEnv
): ResolvedThemeMode {
  const doc = env?.doc ?? (typeof document !== "undefined" ? document : undefined);
  if (!doc) {
    return preference.mode === "dark" ? "dark" : "light";
  }

  const prefersDark =
    env?.prefersDark ??
    (typeof window !== "undefined" &&
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false);

  const resolvedMode = resolveThemeMode(preference.mode, prefersDark);
  const tokens = getThemeTokens(preference, resolvedMode);

  doc.documentElement.classList.toggle("dark", resolvedMode === "dark");
  doc.documentElement.dataset.theme = preference.theme;

  for (const [key, value] of Object.entries(tokens)) {
    doc.documentElement.style.setProperty(key, value);
  }

  return resolvedMode;
}

export function getThemeBootstrapScript(): string {
  return "try{var r=localStorage.getItem('zaloclaw.theme.v1');if(!r)return;var p=JSON.parse(r)||{},d=document.documentElement,m=matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches,k=p.mode==='system'?(m?'dark':'light'):(p.mode||'light'),h=k==='dark';d.classList.toggle('dark',h);var a=typeof p.accentHue==='number'?p.accentHue:({'zinc':null,'slate':240,'stone':70,'rose':20,'violet':300,'sky':210,'emerald':165}[p.theme||'zinc']);if(a===null||a===undefined)return;var c=h?0.14:0.18,l=h?0.76:0.56,g=h?0.72:0.68;d.style.setProperty('--primary','oklch('+l+' '+c+' '+a+')');d.style.setProperty('--ring','oklch('+g+' '+Math.max(c-0.04,0.05)+' '+a+')');d.style.setProperty('--sidebar-primary','oklch('+l+' '+c+' '+a+')');d.style.setProperty('--primary-foreground',h?'oklch(0.205 0 0)':'oklch(0.985 0 0)');}catch(_){}";
}
