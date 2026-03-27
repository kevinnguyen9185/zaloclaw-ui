## 1. Visual Foundations

- [x] 1.1 Define reusable surface layering primitives in global styles (atmosphere, shell, content, emphasis)
- [x] 1.2 Define accent restraint rules for primary actions, active states, and key success states
- [x] 1.3 Define motion primitives for hero entrance, card stagger, and status transitions with reduced-motion fallback
- [x] 1.4 Update app metadata in `layout.tsx` (title, description) with product-quality copy

## 2. Welcome Page

- [x] 2.1 Create `src/app/(welcome)/page.tsx` — full-bleed `zaloclaw-design.png` background with gradient overlay and single "Begin Setup" CTA
- [x] 2.2 Create `src/app/(welcome)/layout.tsx` — bare layout with no shell chrome (no sidebar, no header)
- [x] 2.3 Update `src/app/page.tsx` routing: returning users (completed) → `/dashboard`; first-time users → `/welcome`
- [ ] 2.4 Verify welcome page CTA navigates to `/check` and carries no persistent state side effects
- [ ] 2.5 Verify welcome page portrait crop on mobile preserves mascot and CTA readability

## 3. App Shell Restyle

- [x] 3.1 Add sidebar brand strip — `zaloclaw-design.png` cropped at `object-position: center 38%`, `h-28`, with bottom fade gradient
- [x] 3.2 Restyle sidebar nav with stronger active state (Zalo blue left border + tinted background)
- [x] 3.3 Restyle header with contextual system-state subline below page title
- [x] 3.4 Update main content container spacing rhythm and background atmosphere
- [ ] 3.5 Validate shell readability and layout on desktop and mobile breakpoints

## 4. Dashboard First-Impression Upgrade

- [x] 4.1 Add hero-first dashboard section that summarizes assistant readiness
- [x] 4.2 Rebalance card hierarchy so primary status is visually dominant
- [x] 4.3 Update status card semantics with icon + tone + label (not color only)
- [x] 4.4 Add concise action priority cues for unresolved states
- [ ] 4.5 Verify status updates remain visually calm and not distracting

## 5. Onboarding Experience Restyle

- [x] 5.1 Restyle onboarding shell to a guided premium frame instead of flat centered card
- [x] 5.2 Upgrade step progress visuals for stronger milestone clarity
- [ ] 5.3 Refresh step page hierarchy (check/model/zalo/complete) with state-focused grouping
- [ ] 5.4 Improve onboarding copy tone toward confidence and outcomes
- [ ] 5.5 Add completion-state visual treatment for clear handoff to dashboard

## 6. Settings Visual Integration

- [x] 6.1 Restyle settings page grouping so Theme Settings is secondary personalization
- [ ] 6.2 Align Theme Settings panel visual treatment with new shell/card language
- [ ] 6.3 Preserve existing functionality and preference persistence behavior

## 7. Accessibility and Quality Validation

- [ ] 7.1 Verify contrast on welcome page CTA against gradient overlay
- [ ] 7.2 Verify contrast on hero surfaces, cards, and key action states
- [ ] 7.3 Verify keyboard focus visibility after visual restyle
- [ ] 7.4 Verify reduced-motion behavior for all introduced animations
- [ ] 7.5 Run responsive checks for welcome, onboarding, dashboard, and settings pages
- [ ] 7.6 Capture before/after screenshots for design sign-off
