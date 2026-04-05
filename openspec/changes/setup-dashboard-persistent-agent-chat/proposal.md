## Why

Users need immediate feedback where they spend ongoing time, which is the dashboard, not the welcome setup flow. Placing agent chat in the dashboard lets users see the impact of actions in real time without detouring through onboarding screens.

## What Changes

- Add a persistent agent chat panel to the main dashboard experience.
- Keep chat mounted while users navigate dashboard routes so conversation and draft state are preserved.
- Connect high-signal dashboard actions to chat context updates so assistant responses reflect recent user changes.
- Use an `xl` desktop split layout so dashboard configuration stays on the left and agent chat stays on the right.
- Compact the active model and Zalo channel status surfaces so they remain visible without dominating the page.
- Ensure responsive behavior keeps dashboard controls usable on smaller screens while chat remains accessible.

## Capabilities

### New Capabilities
- `dashboard-agent-chat-presence`: Defines persistent agent chat visibility and continuity across dashboard routes.

### Modified Capabilities
- `dashboard-shell`: Dashboard shell requirements will include embedding and layout behavior for a persistent agent chat panel.

## Impact

- Affected code: dashboard layouts and pages under src/app/(app)/ and shared dashboard UI components under src/components/dashboard/.
- Affected state management: dashboard-scoped chat session state and dashboard-event-to-chat context propagation logic.
- Affected UI behavior: responsive split-pane layout, compact status card presentation, and focus/scroll handling when chat remains mounted across dashboard transitions.
- Dependencies/systems: existing chat rendering infrastructure and localization resources for newly introduced setup chat labels or hints.
