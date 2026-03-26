## 1. Theme Engine Module

- [x] 1.1 Create `src/lib/theme/types.ts` — define `ThemeName`, `ThemeMode`, `ThemePreference`, and `ThemeTokens` types
- [x] 1.2 Create `src/lib/theme/themes.ts` — implement named theme registry with full light + dark OKLCH token sets for Zinc, Slate, Stone, Rose, Violet, Sky, and Emerald
- [x] 1.3 Create `src/lib/theme/engine.ts` — implement `applyTheme(preference)` that writes CSS variable inline styles to `document.documentElement` and toggles `.dark` class
- [x] 1.4 Add accent hue derivation to `engine.ts` — `deriveAccentTokens(hue: number, mode: "light" | "dark")` producing OKLCH values for `--primary`, `--primary-foreground`, `--ring`, `--sidebar-primary`
- [x] 1.5 Create `src/lib/theme/storage.ts` — implement `loadThemePreference()` and `saveThemePreference(pref)` using `localStorage` key `zaloclaw.theme.v1` with safe JSON parse fallback

## 2. No-Flash Inline Script

- [x] 2.1 Write the blocking inline theme script (< 300 bytes) that reads `zaloclaw.theme.v1` from localStorage and applies dark class + token overrides synchronously
- [x] 2.2 Inject the script as `<script dangerouslySetInnerHTML>` in `src/app/layout.tsx` inside `<head>` before stylesheets

## 3. Theme Context & Provider

- [x] 3.1 Create `src/lib/theme/context.tsx` — implement `ThemeProvider` (client component) that initializes from storage, calls `applyTheme`, and subscribes to `prefers-color-scheme` for system mode
- [x] 3.2 Expose `useTheme()` hook from the provider returning `{ theme, accent, mode, setTheme, setAccent, setMode }`
- [x] 3.3 Wrap the root layout `children` in `layout.tsx` with `<ThemeProvider>`

## 4. Base Theme CSS Cleanup

- [x] 4.1 Update `src/app/globals.css` — rename the current `:root` / `.dark` blocks to explicitly be the "Zinc" base theme; remove any hardcoded values that are now handled by the engine at runtime

## 5. Theme Settings UI

- [x] 5.1 Create `src/components/settings/ThemeSettingsPanel.tsx` — theme swatch grid, mode toggle (Light/Dark/System), accent hue section
- [x] 5.2 Implement theme swatch buttons — clicking one calls `setTheme(name)` with live preview; highlight active swatch
- [x] 5.3 Implement 8 preset accent hue swatches (Red, Orange, Yellow, Lime, Teal, Sky, Violet, Pink) — clicking calls `setAccent(hue)` with live preview
- [x] 5.4 Implement accent hue `<input type="range" min="0" max="360">` slider for free-range selection with `onInput` live preview and `onChange` persistence
- [x] 5.5 Implement "Reset accent" button that calls `setAccent(null)`
- [x] 5.6 Implement 3-way mode toggle (Light / Dark / System) using existing `Button` variants
- [x] 5.7 Add `ThemeSettingsPanel` to `src/app/(app)/settings/page.tsx`

## 6. Dashboard Header Quick Toggle

- [x] 6.1 Add a sun/moon icon button to the dashboard layout header that calls `setMode` to toggle between light and dark (resolves "system" to its current effective counterpart)
- [x] 6.2 Verify the button icon reflects the current resolved mode (sun in light, moon in dark)

## 7. Tests

- [x] 7.1 Add unit tests for `engine.ts` — `applyTheme` applies correct CSS variables for each named theme in light and dark mode
- [x] 7.2 Add unit tests for `storage.ts` — round-trip save/load, corrupt JSON fallback to defaults
- [x] 7.3 Add unit tests for accent derivation — given a hue angle, output OKLCH values stay within valid lightness bounds
