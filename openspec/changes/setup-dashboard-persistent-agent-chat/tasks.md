## 1. Dashboard Shell Integration

- [x] 1.1 Identify shared dashboard shell components/routes and add a dashboard-level chat host mount point.
- [x] 1.2 Implement responsive two-pane (desktop) and collapsible chat (narrow viewport) layout behavior without blocking dashboard interactions.
- [x] 1.3 Ensure dashboard routes render through the shared dashboard shell so chat presence is consistent.

## 2. Persistent Chat State

- [x] 2.1 Create a dashboard-scoped chat state provider/store above dashboard routes to preserve messages, draft input, and UI state.
- [x] 2.2 Wire route transition handling so chat state is not reset when navigating between dashboard routes.
- [x] 2.3 Add dashboard-session reset behavior to clear chat state only when reset is explicitly triggered.

## 3. Dashboard Context Event Propagation

- [x] 3.1 Define a normalized dashboard event contract for high-signal actions (route entered, action triggered, save succeeded/failed).
- [x] 3.2 Emit context events from dashboard actions that change relevant state.
- [x] 3.3 Connect emitted dashboard events to the chat context adapter and debounce/coalesce repetitive updates.

## 4. UX, Accessibility, and Validation

- [x] 4.1 Add/update localization keys for any dashboard-chat labels, hints, or controls introduced by the new layout.
- [x] 4.2 Verify keyboard navigation and focus behavior for chat controls within dashboard screens.
- [x] 4.3 Add or update tests covering: chat visible in dashboard, state continuity across dashboard route navigation, and context updates after dashboard actions.
- [x] 4.4 Run responsive QA checks for desktop and mobile breakpoints to confirm dashboard controls remain reachable with chat enabled.

## 5. Desktop Split Layout Refinement

- [x] 5.1 Refactor dashboard page composition so `xl` and larger viewports render configuration content in the left column and persistent chat in the right column.
- [x] 5.2 Compact the active model and Zalo status cards into a lighter-weight summary row that preserves key status and actions.
- [x] 5.3 Validate that stacked mobile and tablet layouts remain readable and functional after the desktop split-layout changes.
