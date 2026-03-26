## Context

The project uses shadcn/ui + Tailwind CSS with OKLCH CSS custom properties for all design tokens. The current palette is a fully achromatic default — no hue, no branded identity, and no user control over appearance. All color variables are defined in `globals.css` under `:root` (light) and `.dark` (dark). There is no theme-switching mechanism today.

The stack gives us a clean foundation: because every component consumes `--primary`, `--background`, etc. via Tailwind, we can change the entire look of the app by swapping CSS variable values on `<html>` at runtime, with zero component-level changes.

## Goals / Non-Goals

**Goals:**
- Ship a curated set of named base themes (Zinc, Slate, Stone, Rose, Violet, Sky, Emerald), each with full light + dark token sets.
- Let users overlay a custom accent hue that drives `--primary`, `--ring`, and `--sidebar-primary` tokens.
- Persist choices in `localStorage` as `zaloclaw.theme.v1`.
- Apply theme on first paint (no FOUC) via a blocking inline script in `<head>`.
- Expose a `ThemeProvider` + `useTheme` hook consumed by the settings UI.
- Light/dark/system mode toggle with system media-query tracking.

**Non-Goals:**
- Per-component or per-page theme overrides.
- Gateway-persisted theme preferences (localStorage only in v1).
- Custom font selection.
- High-contrast or reduced-motion accessibility modes (tracked separately).

## Decisions

### Decision: CSS custom property overrides on `<html>` rather than Tailwind config at build time
Tailwind v4 resolves `@theme inline` tokens at build time, so they cannot be changed at runtime. Instead, the theme engine writes inline `style` attribute overrides directly onto `document.documentElement`. This is the same approach shadcn/ui's own theme generator uses.

**Alternatives considered:**
- CSS class per theme on `<html>` (e.g. `.theme-rose`): requires all theme definitions shipped in the CSS bundle up front. Chosen approach keeps the token sets as JS objects — smaller, tree-shakeable, and easier to derive accent colors programmatically.

### Decision: Accent color derived from a hue angle into OKLCH
Given a user-supplied hue (0–360°), the engine derives the accent series using fixed lightness/chroma values per shade (light: L=0.52, C=0.18; dark: L=0.75, C=0.16). This matches the OKLCH encoding already used in `globals.css` and produces perceptually uniform accents regardless of hue.

**Approach for color picker UI:** render a hue-strip gradient with a draggable thumb — no external color-picker dependency needed (can use `<input type="range">`). Optionally offer 8 preset hue swatches (Red 0°, Orange 30°, Yellow 60°, Lime 100°, Teal 175°, Sky 210°, Violet 270°, Pink 330°) alongside the free-range slider. Include a "Zalo Blue" preset (hue 210°) to match Zalo's brand color (#0573ff).

### Decision: No-flash strategy — blocking inline script in `<html>`
The theme must apply before the browser paints to avoid a white flash on dark-mode users. We add a tiny `<script>` (< 300 bytes, no imports) in `<head>` that reads `localStorage.zaloclaw.theme.v1` and sets `document.documentElement.style` synchronously.

**In Next.js App Router:** use `next/headers`-free approach — the script is injected as a `<script dangerouslySetInnerHTML>` inside the root `layout.tsx` `<head>` section.

### Decision: `ThemeProvider` wraps only client components; server components are unaffected
Theme state lives in a React context + `useTheme` hook. The provider is `"use client"` and placed in `src/lib/theme/context.tsx`. It initialises from storage on mount, applies tokens, and subscribes to `prefers-color-scheme` media changes for system mode.

### Decision: Named theme registry as plain TS objects, not a CSS file per theme
Each theme is a `Record<string, string>` of CSS variable names → OKLCH values. Shipped as `src/lib/theme/themes.ts`. Keeps the total CSS bundle size unchanged (no extra stylesheets) and allows accent color to override individual tokens at runtime without class conflicts.

## Risks / Trade-offs

- **SSR flash risk** → Mitigated by the blocking inline script. If JS is disabled the default light theme is shown.
- **OKLCH browser support** → Already in use by the project; all modern browsers support it. iOS Safari 15.4+, Chrome 111+, Firefox 113+.
- **Token drift** — if shadcn/ui adds new CSS variables in a future upgrade they won't be covered by the theme engine until manually added to the registry. → Low risk; we only need to cover the variables already present in `globals.css`.
- **Accent contrast** — user-chosen hues at extreme lightness/chroma could break contrast ratios. → The derived accent function uses a fixed lightness range (L 0.45–0.75) so we never go outside readable bounds.

## Migration Plan

1. Add `src/lib/theme/` module (no breaking surface).
2. Update `globals.css` `:root` / `.dark` to be the "Zinc" base theme (values unchanged — this is what they already are).
3. Add blocking script to `layout.tsx`.
4. Wrap root layout children with `ThemeProvider`.
5. Add `ThemeSettingsPanel` to settings page.
6. Ship; no data migration required (no gateway schema change).

## Open Questions

- Should the accent color picker expose a full free-form hex input in addition to the hue slider? (Current plan: hue slider + 8 presets — defer hex input to a follow-up.)
- Should the dashboard header get a quickaccess theme toggle button (moon/sun icon) separate from the full settings panel? (Proposed: yes, a single dark-mode toggle icon in the header; full theme picker only in settings.)
