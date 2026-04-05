## Why

The current dashboard use-case setup introduces too much choice for first-time users. For the first release, ZaloClaw should feel like a friendly assistant with a single clear starting path.

Users still need personalization, so they should be able to define what kind of assistant they want in plain language without choosing from multiple use-case cards.

## What Changes

- Simplify dashboard use-case experience to one default use case: friendly user assistant.
- Remove or hide multi-use-case launch UI in the first-release dashboard flow.
- After users choose to start with the assistant, guide them through a short identity interview instead of a single free-text field.
- Collect user and assistant characteristics (assistant name, creature type, vibe, emoji, user name, timezone) with optional starter identity suggestion.
- Generate and persist OpenClaw identity artifacts: `AGENT.md`, `SOUL.md`, and `USER.md`.
- Keep room for future multi-use-case expansion without exposing it in first-release UI.

## Capabilities

### New Capabilities
- `assistant-intent-profile`: Run a guided assistant identity process and generate OpenClaw identity documents from user answers.

### Modified Capabilities
- `dashboard-shell`: Replace multi-use-case launch behavior with a single friendly-assistant experience in first release.

## Impact

- Affected UI: dashboard use-case section/components and related localization strings.
- Affected state/config: storage model for guided identity answers and generated markdown artifacts.
- Affected specs: new `assistant-intent-profile` capability plus `dashboard-shell` requirement updates.
- No external dependency additions expected.
