## 1. Dashboard Layout Mode Foundation

- [x] 1.1 Identify dashboard shell/layout components that own chat and identity configuration regions, and add a dashboard-level layout mode state (`balanced`, `chat-focused`).
- [x] 1.2 Implement layout mode transition helpers/reducer to switch chat/config emphasis in a deterministic way.
- [x] 1.3 Apply responsive rendering rules so chat-focused mode remains usable on desktop and narrow viewports.

## 2. Identity Completion Transition

- [x] 2.1 Wire successful identity completion/save flow to dispatch transition into chat-focused mode.
- [x] 2.2 Auto-collapse identity configuration panel on completion while preserving saved values and form restore behavior.
- [x] 2.3 Add explicit control to reopen configuration and restore balanced mode without route reload.
- [x] 2.4 Remove the inline generated identity artifact preview card from the main dashboard identity surface.

## 3. Session Continuity and Route Behavior

- [x] 3.1 Store chat-focused/collapsed configuration state in dashboard-scoped state shared across dashboard routes.
- [x] 3.2 Ensure dashboard route navigation preserves chat-focused mode until user explicitly changes mode.
- [x] 3.3 Add dashboard-session reset behavior for layout mode where required by shell lifecycle.

## 4. Localization, Accessibility, and Validation

- [x] 4.1 Add/update localization keys for transition labels and reopen/collapse controls in supported locales.
- [x] 4.2 Verify keyboard navigation and focus management when auto-collapse occurs and when reopening configuration.
- [x] 4.3 Add/update tests for identity completion transition, configuration collapse/reopen behavior, and route continuity.
- [x] 4.4 Run responsive QA checks on desktop/mobile breakpoints to confirm chat-focused mode and collapsed configuration remain operable.
- [x] 4.5 Validate that the simplified identity surface still communicates successful generation without inline artifact previews.
