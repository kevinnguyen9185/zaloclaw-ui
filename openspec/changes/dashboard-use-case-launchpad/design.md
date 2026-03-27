## Overview

This design introduces a **Use Case Launchpad** in the dashboard so users can move from "status checking" to "action starting" in one screen.

Primary principle: outcome-first workflows, minimal cognitive load, scalable from 4 to 10 items.

## V1 Scope Confirmation

- V1 dashboard view SHALL show 4 use cases maximum at once.
- V1 data set SHALL support at least 10 use cases in source configuration.
- Overflow behavior for >4 use cases SHALL be handled through a "View all use cases" entry.
- This change defines UX and implementation boundaries; it does not introduce workflow engine execution logic.

## Goals

- Improve first 10-second comprehension of product value.
- Provide clear workflow starting points.
- Maintain visual calm and hierarchy with existing dashboard status cards.
- Keep mobile readability and scannability.

## Non-Goals

- Implementing full workflow engines in this change.
- Introducing new gateway RPC contracts.
- Deep personalization/recommendation ranking logic.

## Information Architecture

### Dashboard Composition

1. Status row (existing): model, channel, gateway context
2. Use Case Launchpad (new):
   - featured card (1)
   - standard cards (up to 3 visible in v1 dashboard block)
   - "View all use cases" action if hidden count exists

Section order is fixed for v1:
1. Assistant status surfaces (existing cards)
2. Use Cases section heading and helper text
3. Featured use case card
4. Standard use case grid
5. Overflow action row (only when hidden cards exist)

### Scalability Strategy

- 1 to 4 use cases: show all cards.
- 5 to 10 use cases: show featured + first 3 standard cards + "View all".
- Future (>10): move to categorized listing in dedicated view.

## Canonical Card Schema

```ts
type UseCaseCard = {
  id: string;
  title: string;
  outcome: string;
  tags: string[];
  effort: "quick" | "standard" | "advanced";
  ctaLabel: string;
  startPath: string;
  featured?: boolean;
  sortOrder: number;
};
```

Card schema rules:
- `id` MUST be stable and URL-safe.
- `title` and `outcome` MUST be plain text (no markdown).
- `tags` SHOULD have 1 to 3 items for visual compactness.
- `startPath` MUST be deterministic and routable.
- `featured` MAY be omitted; runtime resolver selects fallback featured card.

## Featured Selection Rule (v1)

Featured selection resolution order:
1. First item with `featured === true` sorted by `sortOrder`
2. Otherwise first item by ascending `sortOrder`
3. Otherwise first item in array order

Only one featured card is rendered in the launchpad.

## Layout Direction

### Recommended Pattern: Featured + Grid

- Featured card communicates strongest value story.
- Standard cards provide fast alternatives.
- Works well with both desktop and mobile stacking.

Desktop behavior:
- Featured card spans full content width.
- Supporting cards render in 3-column grid where available.
- Card heights are equalized per row.

Mobile behavior:
- Featured card appears first in stack.
- Supporting cards render in single column.
- Primary CTA remains visible without scrolling within card container.

## Overflow and View-All Rules

- If total use cases <= 4: render all cards and hide overflow action.
- If total use cases > 4: render featured + first 3 standard cards, then show:
  - button text: `View all use cases (+N)` where `N = total - rendered`
- The overflow action navigates to a dedicated listing route in implementation phase.

## Empty-State Rules

When no use cases are available:
- Show launchpad section with empty-state panel.
- Show message: "No use cases are configured yet."
- Show fallback CTA: "Go to Settings".
- Fallback CTA target: `/settings`.

## Card Content Model

Each use case card should include:

- `id`
- `title`
- `outcome`
- `tags[]`
- `effort` (`quick`, `standard`, `advanced`)
- `featured` (boolean)
- `ctaLabel`
- `startPath` (or placeholder action)

## UX States

- Default: cards available and actionable.
- Empty: no use cases configured -> show guidance and fallback CTA.
- Overflow: hidden count shown via "View all use cases (+N)".

## CTA Navigation Mapping (Initial 4)

Deterministic start behavior for v1 initial set:

1. `simple-assistant`
  - CTA: `Start`
  - Path: `/settings?useCase=simple-assistant`
2. `customer-support-gmail-excel`
  - CTA: `Start`
  - Path: `/settings?useCase=customer-support-gmail-excel`
3. `news-digest-multi-source`
  - CTA: `Start`
  - Path: `/settings?useCase=news-digest-multi-source`
4. `custom-workflow`
  - CTA: `Start`
  - Path: `/settings?useCase=custom-workflow`

If a mapped destination is unavailable at runtime, implementation should fallback to `/settings`.

## Content and Tone

- Use outcome-focused copy, not technical jargon.
- Prefer short, direct text optimized for Vietnamese readability.
- Keep one-line outcome to avoid dense blocks.

### Initial v1 Copy (Outcome-Focused)

1. `simple-assistant`
  - Title: `Simple Assistant`
  - Outcome: `General Q&A with configurable personality and tone.`
  - Tags: `Personality`, `Tone`
  - Effort: `quick`

2. `customer-support-gmail-excel`
  - Title: `Customer Support with Gmail + Excel`
  - Outcome: `Draft faster replies with inbox and spreadsheet context.`
  - Tags: `Gmail`, `Excel`, `Support`
  - Effort: `standard`

3. `news-digest-multi-source`
  - Title: `Multi-Source News Digest`
  - Outcome: `Collect and summarize updates from selected news sources.`
  - Tags: `News`, `Summary`
  - Effort: `standard`

4. `custom-workflow`
  - Title: `Custom Workflow`
  - Outcome: `Start from a flexible template for your own process.`
  - Tags: `Template`, `Custom`
  - Effort: `advanced`

### Vietnamese-Friendly Copy Constraints

- Title length target: 18 to 42 characters.
- Outcome length target: 55 to 95 characters.
- Prefer concrete verbs: `Draft`, `Summarize`, `Collect`, `Connect`.
- Avoid stacked technical nouns in a single line.
- Prefer sentence-case over all-caps for readability.

## Accessibility

- Cards must be keyboard-focusable.
- CTA labels must be explicit (no icon-only meaning).
- Tags and effort labels cannot be color-only encoded.
- Maintain contrast parity with existing card system.

### Non-Color-Only Validation Rules

- Effort chips MUST include text labels (`Quick`, `Standard`, `Advanced`).
- Tags MUST remain visible and readable in monochrome mode.
- Featured state MUST include structural emphasis (size/border/icon), not hue alone.

### Keyboard and Focus Rules

- Tab order MUST follow visual order: featured card -> standard cards -> view-all CTA.
- Every card CTA MUST expose visible focus ring.
- Enter/Space activation MUST work for CTA controls.
- No card interaction may require pointer hover to reveal critical action.

## Acceptance Checklist (1 to 10 Scaling)

- [ ] With 1 to 4 items, all cards are visible and no overflow action appears.
- [ ] With 5 to 10 items, dashboard view shows featured + 3 cards + correct `+N` count.
- [ ] Featured resolver selects deterministic item using v1 rule order.
- [ ] View-all action appears only when hidden items exist.
- [ ] Section spacing remains consistent with existing dashboard rhythm.

## Mobile Readability Checklist

- [ ] Title wraps to max 2 lines without clipping.
- [ ] Outcome remains readable in max 3 lines.
- [ ] CTA remains visible and tappable on 360px width.
- [ ] Tag chips do not overflow card container.
- [ ] Featured card does not push status cards below practical first scroll.

## Implementation Handoff Notes

Component boundaries:
- `src/components/dashboard/UseCaseLaunchpad.tsx`
  - Owns layout, featured selection, overflow logic.
- `src/components/dashboard/UseCaseCard.tsx`
  - Owns card visuals and CTA rendering.
- `src/lib/dashboard/use-cases.ts`
  - Exports typed `UseCaseCard[]` source for v1.

Suggested props:
- `UseCaseLaunchpad({ items, maxVisible = 4, onStart })`
- `UseCaseCard({ item, featured = false, onStart })`

Test focus:
- Featured resolution determinism.
- Overflow count rendering.
- Empty-state fallback rendering.
- Keyboard focus visibility and activation.
- Mobile rendering at 360px and 390px widths.

## Risks and Mitigations

- Risk: visual noise with too many cards.
  - Mitigation: strict visible-card limit + "View all".

- Risk: unclear CTA outcomes.
  - Mitigation: standardized CTA labels and destination rules.

- Risk: drift from dashboard-shell hierarchy.
  - Mitigation: maintain launchpad below status row and preserve spacing rhythm.