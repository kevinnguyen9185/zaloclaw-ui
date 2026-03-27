## Context

The codebase already uses token-driven theming and reusable shadcn/ui primitives. The current visual baseline is clean but neutral and flat. Most screens use similar card weight, spacing density, and low-contrast framing, which reduces first-impression impact.

The redesign should preserve existing app architecture and focus on visual hierarchy, emotional tone, and clarity of system state.

## Goals / Non-Goals

**Goals:**
- Deliver a cohesive Calm Premium + Zalo Energy visual language across onboarding and app shells.
- Improve first-view perception within 10 seconds through clearer hierarchy and stronger focal surfaces.
- Make status and next actions visually obvious without adding workflow complexity.
- Keep interaction behavior stable while upgrading presentation quality.

**Non-Goals:**
- No business-logic or gateway protocol changes.
- No new onboarding steps or additional settings features.
- No per-user cloud-synced design preferences in this change.

## Decisions

### Decision: Hero-first page hierarchy for onboarding and dashboard
Each major page will have one dominant focal surface at the top (hero state card), followed by secondary supporting cards.

**Rationale:**
Current content is useful but visually undifferentiated. A dominant top surface improves comprehension and perceived polish.

### Decision: Surface layering and atmospheric framing as global system
Introduce consistent depth layers:
- Background atmosphere layer (subtle gradients/noise)
- Shell layer (sidebar/header surfaces)
- Content layer (cards)
- Emphasis layer (active, success, primary CTA)

**Rationale:**
Layering creates premium feel without relying on saturated colors.

### Decision: Accent restraint policy
Zalo blue is used only for:
- Primary CTA
- Active navigation/current step
- Positive key-state highlight

Neutral surfaces remain dominant.

**Rationale:**
Overuse of brand color reduces trust and sophistication.

### Decision: Status semantics by shape + tone, not color alone
Status cards and badges will use iconography, labels, and tone intensity together.

**Rationale:**
Improves scanability and accessibility, avoids dependence on color-only signals.

### Decision: Motion is meaningful and sparse
Use only:
- Initial hero entrance
- Staggered reveal for secondary cards
- Soft state transitions for status updates

Respect reduced-motion preferences.

**Rationale:**
Supports premium quality without visual noise.

### Decision: Welcome page as dedicated first-impression route
A new `/welcome` route is introduced for first-time users. The root `page.tsx` routing logic is updated: returning users (onboarding completed) go directly to `/dashboard`; first-time users (no `completed` flag in localStorage) are sent to `/welcome` instead of directly to `/check`.

The welcome page uses `public/zaloclaw-design.png` as a full-bleed background (`object-cover`, `object-center`). A gradient overlay fades the lower 50% to near-black so the existing wordmark and tagline in the image remain readable and the CTA button floats cleanly above the image content. No additional heading text is added — the image wordmark is the title.

**Rationale:**
The image has a strong enough typographic and mascot presence to stand alone. Adding a redundant HTML heading would dilute the dramatic impact. The CTA is the only interactive element on the screen, keeping the first moment clear and intentional.

**Routing diagram:**
```
/  (page.tsx)
├── completed === true   →  /dashboard
└── completed === false  →  /welcome
                               ↓  click "Begin Setup"
                            /check  (existing onboarding entry)
```

### Decision: Sidebar brand strip using center crop of hero image
The app shell sidebar gets a brand strip at the top using the same `zaloclaw-design.png`, cropped to the mascot torso + circuit glow zone. Strip is `h-28`, `object-cover`, `object-position: center 38%` which centers on the red metallic body with the Zalo badge emblem. A bottom gradient fades the strip into the sidebar background so the nav items below read cleanly.

**Why sidebar, not header:**
The header contains live functional state (page title, gateway badge, dark mode toggle). Brand imagery there creates visual competition with operational content. The sidebar is the persistent identity surface and the natural home for the brand anchor.

**Why not full image in sidebar:**
At `w-56` the full-width crop would show only the atmospheric sky zone — no mascot visible. The targeted `object-position` crop reliably shows the most recognizable brand element regardless of sidebar width.

**Crop zone from the image:**
```
┌──────────────────────────────────────────────────┐
│ code particles │  [antennae]  │  white robot     │  ← cropped out (top)
│                │  [HEAD]      │                  │
├────────────────┼──────────────┼──────────────────┤
│                │  [TORSO]  ★  │                  │  ← visible in strip
│   Zalo icon    │  Zalo badge  │                  │  ← visible in strip
│                │  circuits    │                  │  ← visible in strip
├────────────────┼──────────────┼──────────────────┤
│         ZaloClaw wordmark + tagline               │  ← cropped out (bottom)
└──────────────────────────────────────────────────┘
```

## Screen-Level Design Plan

### Welcome page `/welcome`
- Full-bleed `zaloclaw-design.png` background, `object-cover`, viewport height.
- Gradient overlay: `from-transparent via-transparent to-black/80` anchored at bottom.
- Single CTA button "Begin Setup" (primary, Zalo blue) centered in lower third.
- Exiting via CTA navigates to `/check` to begin onboarding.
- No header, no sidebar, no navigation chrome — pure brand moment.
- Mobile: image still works; mascot head/body zone is centered and preserved on portrait crop.

### App shell
- Sidebar top: brand strip (h-28, cropped hero image, bottom fade gradient) above brand name and nav.
- Sidebar nav: richer tonal treatment, stronger active state using Zalo blue left border + background tint.
- Header: adds brief contextual system-state line below page title.
- Main content: atmospheric backdrop and larger spacing rhythm.

### Dashboard
- Add hero status surface summarizing assistant readiness.
- Keep model and Zalo cards, but set asymmetric importance.
- Add concise "last checked" context and clearer action priority.

### Onboarding shell and steps
- Convert centered utility card into guided product experience frame.
- Upgrade step progress with stronger visual milestones and state continuity.
- Rephrase step copy toward confidence and outcomes.
- Complete step becomes celebratory confirmation with clear handoff CTA.

### Settings
- Keep theme settings panel and config summary.
- Improve visual grouping so personalization feels supportive, not dominant.

## Risks / Trade-offs

- Visual scope can expand quickly if not constrained by reusable primitives.
- Heavier styling can hurt readability if accent and depth are overused.
- Motion can feel distracting without strict limits and reduced-motion fallbacks.

## Mitigations

- Introduce reusable utility classes for layers and emphasis states.
- Define strict accent usage rules and map them to component states.
- Add reduced-motion checks for all introduced animations.
- Validate on mobile breakpoints to maintain first-impression quality on small screens.

## Validation Plan

- Snapshot review of key pages before/after restyle.
- UX acceptance check for first 10-second clarity:
  - Can user identify current system state quickly?
  - Is the primary next action obvious?
  - Does UI feel like a trusted product?
- Accessibility check:
  - Contrast for key states
  - Keyboard focus visibility
  - Reduced-motion behavior
