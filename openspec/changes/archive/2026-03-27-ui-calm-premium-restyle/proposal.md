## Why

The current UI is functionally reliable but visually reads like an internal admin panel. First-time users do not get an immediate sense of product quality, trust, or brand confidence.

The product needs a consistent visual direction that feels modern and attractive while staying calm and operationally clear:
- Visual style: Calm Premium + Zalo Energy
- Core mood: neutral layered surfaces, soft atmospheric background, crisp blue accents only on key actions and active states
- Perception goal: trusted assistant product, not an internal tool

## What Changes

- Add a full-screen branded **welcome page** as the first impression for new users, using the ZaloClaw hero image (`public/zaloclaw-design.png`) as a full-bleed background with a single Get Started CTA.
- Add a **sidebar brand strip** in the app shell that crops the mascot torso zone from the same image, anchoring brand identity across all working screens.
- Restyle the onboarding shell and all onboarding steps with stronger hierarchy, cleaner copy rhythm, and branded visual focus.
- Restyle the app shell (sidebar, header, page framing) to remove flat utility-panel appearance.
- Restyle dashboard information architecture so the most important status appears in a hero surface first.
- Establish a reusable visual language for surface depth, spacing, status semantics, and motion.
- Keep existing behavior and data flows intact; this is a presentation and UX hierarchy upgrade, not a feature rewrite.

The user journey then reads as three distinct visual moments:
1. **Welcome** — full hero image, brand wow, single CTA. Dark and dramatic.
2. **Setup** — neutral atmospheric shell, clear step focus. Calm and guided.
3. **Working** — Calm Premium surfaces with sidebar brand anchor. Focused and trustworthy.

## Capabilities

### New Capabilities
- `welcome-page`: Full-screen branded entry for first-time users, routing through localStorage check before redirect to setup or dashboard.
- `ui-visual-direction`: Product-level visual system for Calm Premium + Zalo Energy, including surface layering, emphasis rules, and accent usage constraints.
- `dashboard-first-impression`: Dashboard hero and status hierarchy optimized for first 10-second comprehension.

### Modified Capabilities
- `onboarding-wizard`: Onboarding pages adopt premium visual hierarchy and clearer state-focused messaging.
- `theme-settings-ui`: Theme controls remain available but are visually integrated as a secondary personalization layer instead of the primary visual identity.

## Impact

- `public/zaloclaw-design.png`: ZaloClaw hero image asset (already added).
- `src/app/(welcome)/page.tsx`: New welcome page route with full-bleed hero and Get Started CTA.
- `src/app/page.tsx`: Updated routing to pass through welcome page for first-time users.
- `src/app/globals.css`: atmospheric background primitives, updated surface tokens, and motion primitives.
- `src/app/layout.tsx`: metadata and global framing updates for product-quality presentation.
- `src/app/(app)/layout.tsx`: sidebar brand strip and improved shell visual hierarchy.
- `src/app/(app)/dashboard/page.tsx`: hero-first dashboard layout with asymmetric card hierarchy.
- `src/components/dashboard/*`: visual restyle for status semantics and card emphasis.
- `src/components/onboarding/*` and `src/app/(onboarding)/*`: onboarding visual refresh with stronger progress and completion storytelling.
- No gateway API or persistence schema changes expected.
