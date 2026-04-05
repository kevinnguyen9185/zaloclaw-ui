## Context

The dashboard is the primary post-onboarding workspace, but agent chat is not currently anchored there in a persistent way. Users should be able to act in dashboard and immediately observe assistant feedback in the same view. This change introduces a persistent chat surface in dashboard shell and dashboard routes so actions and assistant feedback stay co-located.

Key constraints:
- Dashboard routes already share app-shell layout primitives.
- Chat state must survive route transitions between dashboard pages.
- Layout must remain usable on narrow viewports.

## Goals / Non-Goals

**Goals:**
- Ensure agent chat is visible in dashboard experience.
- Preserve chat session continuity (messages, draft, scroll anchor) while moving across dashboard routes.
- Provide immediate dashboard-context signals to chat so assistant responses reflect recent user changes.
- Keep dashboard controls accessible on desktop and mobile breakpoints.

**Non-Goals:**
- Redesigning assistant capabilities or model behavior.
- Replacing existing dashboard navigation semantics.
- Introducing cross-user or server-side shared chat history.
- Adding chat to welcome setup/onboarding routes.

## Decisions

1. Introduce a shared dashboard-level chat host in app layout
- Decision: Mount chat container in the shared dashboard shell layer used by dashboard routes.
- Rationale: A shared host avoids remounting on each step transition and preserves local UI continuity.
- Alternative considered: Embedding chat independently in each dashboard page component. Rejected due to duplicated logic and state resets on navigation.

2. Use dashboard context events to annotate chat with recent user actions
- Decision: Emit normalized dashboard events (page entered, action triggered, save succeeded/failed) to a chat context adapter.
- Rationale: Event-based context is lightweight and testable; it avoids hard-coupling chat UI to step component internals.
- Alternative considered: Polling dashboard state snapshot from chat. Rejected due to stale timing and unnecessary render pressure.

3. Use responsive split layout with collapsible behavior on smaller screens
- Decision: `xl` and larger viewports use a left-content/right-chat split layout; smaller viewports use stacked content with chat remaining quickly reachable in-flow.
- Rationale: Preserves dashboard content usability while keeping chat available.
- Alternative considered: Fixed overlay chat on all viewports. Rejected because it obscures step content on smaller devices.

4. Keep status surfaces compact when chat becomes a permanent dashboard element
- Decision: Active model and Zalo channel cards remain present but move to a compact summary row above the left-column workspace content.
- Rationale: These statuses are useful orientation signals, but they should not compete with chat and configuration for vertical space.
- Alternative considered: Leaving full-detail cards above chat. Rejected because it creates excessive scroll and weakens the desktop split-pane value.

4. Keep chat state in a dashboard-scoped client store
- Decision: Store conversation, draft input, and UI position in dashboard-scoped state provider above dashboard routes.
- Rationale: Prevents state loss across navigation while keeping lifecycle bounded to dashboard flow.
- Alternative considered: Persisting every transient chat state to gateway config. Rejected as unnecessary and potentially noisy.

## Risks / Trade-offs

- [Risk] Layout crowding on medium-width devices can reduce form readability. -> Mitigation: define explicit breakpoints and minimum pane widths with stacked fallback before the `xl` split layout activates.
- [Risk] High-frequency dashboard change events may produce noisy assistant context. -> Mitigation: debounce/coalesce repetitive events and send only meaningful deltas.
- [Risk] Persisted chat state can become stale after dashboard session restart. -> Mitigation: reset dashboard-scoped store on explicit reset boundaries.
- [Trade-off] Shared chat host increases dashboard shell responsibility. -> Mitigation: isolate chat host and adapter behind dedicated components/hooks.

## Migration Plan

1. Add dashboard page split layout and compact status summary structure behind a feature-safe incremental change.
2. Integrate dashboard event adapter and wire from key dashboard actions.
3. Validate route transitions preserve chat state and context updates.
4. Rollout with manual QA across desktop/mobile breakpoints and localization checks.
5. Rollback strategy: remove/disable dashboard chat host mounting and revert to prior dashboard layout without data migration needs.

## Open Questions

- Should mobile default to collapsed chat or restore last open/closed state per dashboard session?
- Which dashboard actions are high-signal enough for context forwarding by default?
- Do we need explicit accessibility announcements when context updates are sent to chat?
