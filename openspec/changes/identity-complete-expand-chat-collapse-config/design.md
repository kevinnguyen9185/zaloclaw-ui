## Context

The dashboard currently presents identity configuration and chat together, but once identity setup is completed the interface does not shift emphasis toward chat usage. Users must manually adjust layout focus, which delays immediate validation of identity behavior.

The requested behavior is a transition trigger tied to successful identity completion: chat expands to full focus and configuration collapses.

Constraints:
- Dashboard shell already manages shared route layout and responsive breakpoints.
- Identity completion is driven from dashboard identity flow actions.
- Configuration must remain recoverable for edits after collapse.

## Goals / Non-Goals

**Goals:**
- Automatically switch dashboard into chat-focused expanded mode when identity setup completes successfully.
- Collapse configuration panel after completion while preserving ability to reopen.
- Keep expanded/collapsed state consistent while navigating dashboard routes.
- Preserve accessibility and responsive usability in collapsed/expanded transitions.

**Non-Goals:**
- Redesigning identity form questions or validation rules.
- Changing bot identity generation semantics.
- Adding this transition behavior to onboarding/welcome setup routes.

## Decisions

1. Introduce explicit dashboard layout mode state
- Decision: Add a dashboard-level layout mode state with at least `balanced` and `chat-focused` modes.
- Rationale: Keeps transition behavior deterministic and easy to test.
- Alternative considered: Deriving layout solely from panel width thresholds. Rejected because completion-triggered transitions become implicit and harder to reason about.

2. Trigger mode transition on identity completion success event
- Decision: Identity save/generation success dispatches a layout transition event that sets chat-focused mode and collapses configuration.
- Rationale: Aligns UI change with user intent milestone and avoids premature transitions.
- Alternative considered: Transition on first valid form state. Rejected because it can collapse config before user confirms completion.

3. Preserve manual override controls
- Decision: Provide explicit controls to reopen configuration and return to balanced mode.
- Rationale: Users need safe editability after automatic collapse.
- Alternative considered: One-way auto-collapse without reopen controls. Rejected due to poor recoverability.

4. Persist mode across dashboard routes in a dashboard-scoped store
- Decision: Keep mode and panel visibility in shared dashboard state so route changes do not reset focus.
- Rationale: Meets continuity expectations and avoids layout flicker.
- Alternative considered: Per-page local state. Rejected because transitions would reset on navigation.

5. Remove generated identity artifact previews from the primary dashboard flow
- Decision: Do not render inline `AGENT.md`, `SOUL.md`, and `USER.md` previews in the main dashboard identity surface.
- Rationale: After identity completion, the next meaningful action is chatting or configuring follow-up skills, not reading implementation artifacts.
- Alternative considered: Keep the previews visible in a side card. Rejected because it increases clutter and weakens the intended chat-focused transition.

## Risks / Trade-offs

- [Risk] Unexpected auto-collapse may confuse users. -> Mitigation: show a clear state indicator and a one-click “reopen config” action.
- [Risk] Responsive breakpoints may cause cramped layout after mode switch. -> Mitigation: define dedicated mobile behavior where chat focus uses full-width stacking and configuration is drawer-like.
- [Trade-off] Removing inline artifact previews reduces immediate visibility into generated files. -> Mitigation: retain saved generation state and reserve advanced artifact inspection for a later dedicated surface if needed.
- [Trade-off] Additional UI state complexity in dashboard shell. -> Mitigation: centralize transitions in a small layout-mode reducer/hook with tests.

## Migration Plan

1. Add dashboard layout mode state and transition helpers.
2. Wire identity completion success to transition into chat-focused mode and collapse configuration.
3. Simplify the primary identity surface by removing generated artifact preview content.
4. Add reopen/restore controls and localization strings.
5. Validate route continuity, keyboard flow, and responsive behavior.
6. Rollback strategy: disable auto-transition trigger and keep dashboard in existing balanced layout.

## Open Questions

- Should chat-focused mode be sticky across browser refresh or only per active session?
- Do we need an optional toast/message when configuration is auto-collapsed?
- Should settings route inherit chat-focused mode or always start balanced?
