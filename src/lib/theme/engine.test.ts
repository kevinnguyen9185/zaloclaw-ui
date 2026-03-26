import { describe, expect, it } from "vitest";

import {
  applyTheme,
  deriveAccentTokens,
  getThemeTokens,
  resolveThemeMode,
} from "@/lib/theme/engine";
import { THEME_NAMES, type ThemePreference } from "@/lib/theme/types";

function createMockDocument() {
  const values = new Map<string, string>();
  const classSet = new Set<string>();

  return {
    documentElement: {
      dataset: {} as Record<string, string>,
      classList: {
        toggle(name: string, force?: boolean) {
          if (force) {
            classSet.add(name);
            return;
          }

          classSet.delete(name);
        },
        contains(name: string) {
          return classSet.has(name);
        },
      },
      style: {
        setProperty(key: string, value: string) {
          values.set(key, value);
        },
        getPropertyValue(key: string) {
          return values.get(key) ?? "";
        },
      },
    },
  } as unknown as Document;
}

function readLightness(value: string): number {
  const match = value.match(/^oklch\(([-0-9.]+)\s+/);
  if (!match) {
    throw new Error(`Unexpected oklch token: ${value}`);
  }

  return Number(match[1]);
}

describe("theme engine", () => {
  it("resolves system mode based on preference", () => {
    expect(resolveThemeMode("system", true)).toBe("dark");
    expect(resolveThemeMode("system", false)).toBe("light");
    expect(resolveThemeMode("dark", false)).toBe("dark");
  });

  it("applies theme tokens for all named themes", () => {
    for (const theme of THEME_NAMES) {
      const doc = createMockDocument();
      const preference: ThemePreference = {
        theme,
        mode: "dark",
        accentHue: null,
      };

      const resolved = applyTheme(preference, {
        doc,
        prefersDark: true,
      });

      expect(resolved).toBe("dark");
      expect(doc.documentElement.classList.contains("dark")).toBe(true);
      expect(doc.documentElement.dataset.theme).toBe(theme);
      expect(doc.documentElement.style.getPropertyValue("--background")).toMatch(
        /^oklch\(/
      );
      expect(doc.documentElement.style.getPropertyValue("--primary")).toMatch(
        /^oklch\(/
      );
    }
  });

  it("derives bounded accent tokens", () => {
    const light = deriveAccentTokens(210, "light");
    const dark = deriveAccentTokens(210, "dark");

    expect(readLightness(light["--primary"])).toBeGreaterThanOrEqual(0.45);
    expect(readLightness(light["--primary"])).toBeLessThanOrEqual(0.8);
    expect(readLightness(dark["--primary"])).toBeGreaterThanOrEqual(0.45);
    expect(readLightness(dark["--primary"])).toBeLessThanOrEqual(0.8);
  });

  it("overrides primary tokens when accent is set", () => {
    const base = getThemeTokens(
      {
        theme: "zinc",
        mode: "light",
        accentHue: null,
      },
      "light"
    );

    const accented = getThemeTokens(
      {
        theme: "zinc",
        mode: "light",
        accentHue: 330,
      },
      "light"
    );

    expect(accented["--primary"]).not.toBe(base["--primary"]);
    expect(accented["--ring"]).not.toBe(base["--ring"]);
  });
});
