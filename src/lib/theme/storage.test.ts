import { beforeEach, describe, expect, it } from "vitest";

import {
  loadThemePreference,
  saveThemePreference,
  THEME_STORAGE_KEY,
} from "@/lib/theme/storage";

type StorageMock = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  clear: () => void;
};

function createStorageMock(): StorageMock {
  const map = new Map<string, string>();

  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    clear: () => {
      map.clear();
    },
  };
}

describe("theme storage", () => {
  beforeEach(() => {
    const storage = createStorageMock();
    (globalThis as Record<string, unknown>).window = {
      localStorage: storage,
    };
  });

  it("round-trips preferences", () => {
    saveThemePreference({
      theme: "emerald",
      mode: "dark",
      accentHue: 140,
    });

    expect(loadThemePreference()).toEqual({
      theme: "emerald",
      mode: "dark",
      accentHue: 140,
    });
  });

  it("falls back when JSON is invalid", () => {
    const windowRef = (globalThis as Record<string, unknown>).window as {
      localStorage: StorageMock;
    };

    windowRef.localStorage.setItem(THEME_STORAGE_KEY, "{not-json");
    expect(loadThemePreference()).toEqual({
      theme: "zinc",
      mode: "system",
      accentHue: null,
    });
  });

  it("normalizes invalid payload values", () => {
    const windowRef = (globalThis as Record<string, unknown>).window as {
      localStorage: StorageMock;
    };

    windowRef.localStorage.setItem(
      THEME_STORAGE_KEY,
      JSON.stringify({
        theme: "does-not-exist",
        mode: "blue",
        accentHue: 725,
      })
    );

    expect(loadThemePreference()).toEqual({
      theme: "zinc",
      mode: "system",
      accentHue: 5,
    });
  });
});
