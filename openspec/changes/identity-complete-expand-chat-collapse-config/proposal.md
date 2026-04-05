## Why

After users finish Identity setup for the bot, they should immediately transition into an interaction-focused mode instead of staying in a configuration-heavy layout. Expanding chat to full and collapsing configuration at that moment reduces friction and helps users validate the bot identity outcome right away.

## What Changes

- Add a post-identity-completion layout transition in dashboard so chat becomes the primary surface.
- Collapse the identity configuration panel automatically once identity setup is completed successfully.
- Preserve user control so configuration can still be reopened if further edits are needed.
- Remove the inline generated `AGENT.md` / `SOUL.md` / `USER.md` preview card from the primary dashboard identity surface.
- Ensure responsive behavior keeps the full-chat mode and collapsed-config state usable on desktop and mobile.

## Capabilities

### New Capabilities
- `dashboard-identity-completion-layout-transition`: Defines dashboard behavior that promotes chat to full mode and collapses configuration after successful Identity completion.

### Modified Capabilities
- `dashboard-shell`: Dashboard shell requirements will include support for full-chat emphasis mode and collapsed configuration state transitions.

## Impact

- Affected code: dashboard shell and identity/config UI flow under src/app/(app)/ and src/components/dashboard/.
- Affected state management: dashboard chat layout state and identity-completion transition state.
- Affected UI behavior: panel expansion/collapse orchestration, simplified identity surface composition, focus handling, and responsive layout behavior.
- Dependencies/systems: dashboard localization resources for new labels/actions related to expanded chat and collapsed config.
