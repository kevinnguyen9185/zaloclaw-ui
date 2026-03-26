## Why

The model dropdown in onboarding step 2 only shows models from OpenRouter. When OpenClaw is configured with its own default model (e.g. `openclaw-smart-router` via litellm), that model is not in the OpenRouter list and would never appear as an option — even though it is the active default the agent is already using. Users end up selecting an OpenRouter model unaware that a perfectly valid default already exists.

## What Changes

- On model step load, call `sessions.list` (with `includeGlobal: true`) in parallel with `models.list`
- Extract `payload.defaults.model` and `payload.defaults.modelProvider` from the response
- If the default model is not already present in the fetched model list, prepend a synthetic entry for it
- The merged entry is visually distinguished (e.g. labelled "Default (OpenClaw)" or similar) so users understand its origin
- Failure to fetch sessions.list is non-blocking; model step continues with the original list

## Capabilities

### New Capabilities
<!-- none — this is a pure enhancement to an existing capability -->

### Modified Capabilities
- `onboarding-wizard`: Model step now merges an OpenClaw-sourced default model into the displayed list when it is not already present

## Impact

- `src/app/(onboarding)/model/page.tsx` — additional parallel fetch and merge logic
- `src/app/(onboarding)/model/selection.ts` — new helper(s) for fetching sessions defaults and merging model list
- No new routes or API endpoints
- No breaking changes
