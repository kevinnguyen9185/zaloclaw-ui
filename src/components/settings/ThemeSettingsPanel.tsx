"use client";

import { CheckIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme/context";
import { THEME_NAMES, type ThemeMode, type ThemeName } from "@/lib/theme/types";

const THEME_LABELS: Record<ThemeName, string> = {
  zinc: "Zinc",
  slate: "Slate",
  stone: "Stone",
  rose: "Rose",
  violet: "Violet",
  sky: "Sky",
  emerald: "Emerald",
};

const THEME_SWATCHES: Record<ThemeName, string> = {
  zinc: "#27272a",
  slate: "#334155",
  stone: "#57534e",
  rose: "#e11d48",
  violet: "#7c3aed",
  sky: "#0284c7",
  emerald: "#059669",
};

const MODE_OPTIONS: Array<{ id: ThemeMode; label: string }> = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "System" },
];

const PRESET_HUES = [
  { label: "Red", hue: 0 },
  { label: "Orange", hue: 30 },
  { label: "Yellow", hue: 60 },
  { label: "Lime", hue: 100 },
  { label: "Teal", hue: 175 },
  { label: "Sky", hue: 205 },
  { label: "Violet", hue: 270 },
  { label: "Pink", hue: 330 },
  { label: "Zalo Blue", hue: 210 },
] as const;

function swatchStyle(hue: number): string {
  return `oklch(0.58 0.18 ${hue})`;
}

export function ThemeSettingsPanel() {
  const { theme, mode, accentHue, setTheme, setMode, setAccent } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme Settings</CardTitle>
        <CardDescription>
          Personalize the interface with a base theme, accent hue, and mode.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-2">
          <h3 className="text-sm font-medium">Base Theme</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {THEME_NAMES.map((name) => {
              const selected = theme === name;

              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setTheme(name)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border p-2 text-left text-xs transition hover:border-primary",
                    selected ? "border-primary ring-2 ring-primary/30" : "border-border"
                  )}
                >
                  <span
                    className="h-5 w-5 rounded-full border border-black/10"
                    style={{ backgroundColor: THEME_SWATCHES[name] }}
                  />
                  <span className="truncate">{THEME_LABELS[name]}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-medium">Accent Presets</h3>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {PRESET_HUES.map((preset) => {
              const selected = accentHue === preset.hue;

              return (
                <button
                  key={`${preset.label}-${preset.hue}`}
                  type="button"
                  onClick={() => setAccent(preset.hue)}
                  className={cn(
                    "relative flex items-center justify-center rounded-md border p-2 text-xs transition",
                    selected ? "border-primary ring-2 ring-primary/30" : "border-border"
                  )}
                  title={preset.label}
                >
                  <span
                    className="h-4 w-4 rounded-full border border-black/10"
                    style={{ backgroundColor: swatchStyle(preset.hue) }}
                  />
                  {selected ? (
                    <CheckIcon className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-background p-0.5 text-primary" />
                  ) : null}
                </button>
              );
            })}
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground" htmlFor="accent-hue">
              Accent hue: {accentHue ?? 210}deg
            </label>
            <input
              id="accent-hue"
              type="range"
              min={0}
              max={360}
              value={accentHue ?? 210}
              onInput={(event) => setAccent(Number(event.currentTarget.value))}
              onChange={(event) => setAccent(Number(event.currentTarget.value))}
              className="w-full"
              style={{ accentColor: "#0573ff" }}
            />
          </div>
          <Button type="button" variant="outline" onClick={() => setAccent(null)}>
            Reset accent
          </Button>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-medium">Mode</h3>
          <div className="flex flex-wrap gap-2">
            {MODE_OPTIONS.map((option) => (
              <Button
                key={option.id}
                type="button"
                variant={mode === option.id ? "default" : "outline"}
                onClick={() => setMode(option.id)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
