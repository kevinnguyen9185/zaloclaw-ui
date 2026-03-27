## Why

The dashboard currently focuses on system status (model + Zalo connectivity) but does not help users quickly start meaningful assistant workflows.

Users need a clear launch surface that answers: "What can I do now?" with concrete, business-oriented use cases.

A dedicated Use Case Launchpad on the dashboard will improve first-session clarity, perceived product value, and activation into practical workflows.

## What Changes

- Add a new Dashboard section: **Use Cases**.
- Support 4 cards in v1 and scalable presentation up to at least 10 items without clutter.
- Define a card pattern with:
  - title
  - one-line outcome
  - capability tags
  - effort label
  - primary CTA
- Use a **featured + grid** layout as default:
  - one featured use case
  - 3 additional cards in dashboard view
  - "View all use cases" entry point when total > displayed
- Keep this change UI/spec focused; no gateway protocol changes.

## Capabilities

### New Capabilities
- `dashboard-use-case-launchpad`: a dashboard module that presents actionable workflow templates and routes users to a start flow.

### Modified Capabilities
- `dashboard-shell`: extended information architecture to include a launchpad section below status overview cards.

## Impact

- `src/app/(app)/dashboard/page.tsx` (layout extension for launchpad section)
- `src/components/dashboard/*` (new launchpad and card components)
- `openspec/specs/dashboard-shell/spec.md` (potential follow-up sync target)

No backend API changes are required for v1 if use cases are static/config-driven in UI.