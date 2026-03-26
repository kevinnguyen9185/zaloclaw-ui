## Why

The current UI uses a plain achromatic shadcn/ui default theme with no accent color and no light/dark mode toggle exposed to the user. For a tool users interact with daily, a polished, personalized appearance drives trust and makes the interface a pleasure to use rather than merely functional.

## What Changes

- Replace the default flat gray palette with a curated set of named themes (e.g. Zinc, Slate, Rose, Violet, Sky, Emerald) each with a matching light and dark variant.
- Add a color-accent picker so users can overlay a chosen hue onto any theme (drives `--primary` / `--ring` / `--sidebar-primary` tokens).
- Add a light/dark/system mode toggle that persists across reloads.
- Expose a **Theme Settings** panel accessible from the dashboard and settings page.
- Persist the user's choices to `localStorage` so preferences survive reloads and navigation without requiring a gateway round-trip.
- Apply theme tokens at the `<html>` element so every shadcn/ui component inherits them automatically via CSS custom properties.

## Capabilities

### New Capabilities

- `theme-engine`: Runtime theme switching — CSS-variable override layer, a named-theme registry, an accent-color derivation utility, and a `ThemeProvider` context that hydrates from storage and applies tokens to `<html>`.
- `theme-settings-ui`: User-facing theme settings panel with theme swatches, accent color picker, and light/dark/system toggle. Embedded in the settings page and accessible via a quick-access button in the dashboard header.

### Modified Capabilities

- `onboarding-wizard`: No spec-level requirement changes (implementation only — theme provider wraps the shell so onboarding inherits the chosen palette).

## Impact

- `src/app/globals.css` — base token definitions expanded with named theme classes; default dark/light tokens replaced by theme-driven values.
- `src/app/layout.tsx` — `ThemeProvider` added to the root layout.
- `src/components/settings/` — new `ThemeSettingsPanel` component and supporting swatches.
- `src/lib/theme/` — new module: `engine.ts` (token registry + application), `storage.ts` (persistence), `context.tsx` (React provider + hook), `types.ts`.
- `localStorage` key `zaloclaw.theme.v1` — stores `{ theme: string, accent: string | null, mode: "light" | "dark" | "system" }`.
- No gateway API changes.
