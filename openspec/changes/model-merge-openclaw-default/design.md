## Context

The onboarding model step (step 2) currently fetches `models.list` from the gateway and separately reads `GET /api/gateway/config` to find a configured default model ID. The model selection dropdown is then pre-populated with OpenRouter models.

OpenClaw maintains its own runtime session defaults at `payload.defaults` in the `sessions.list` response. These defaults (`model`, `modelProvider`) represent the model the agent already uses (e.g. `openclaw-smart-router` via `litellm`). That model is not an OpenRouter model and will never appear in the `models.list` response.

Without this change, a user who is running OpenClaw with an in-house litellm model must manually type or know the model ID; there is no dropdown entry for it.

## Goals / Non-Goals

**Goals:**
- Fetch `sessions.list` in parallel with the existing `models.list` call
- Extract `payload.defaults.model` and `payload.defaults.modelProvider` from the response
- If the sessions-default model is not already present in the fetched model list, prepend a synthetic `ModelOption` entry for it
- Failure to fetch `sessions.list` is silent and non-blocking — the model list continues to load without it

**Non-Goals:**
- Replacing or modifying the existing `extractConfiguredDefaultModelId` / gateway-config-based pre-selection path
- Showing sessions metadata (context tokens, provider details) in the UI beyond what `ModelOption` already captures
- Auto-selecting the sessions default model (selection logic already handles this via `reconcileModelSelection`)

## Decisions

### Decision 1: New helpers in `selection.ts`, not in `page.tsx`

`page.tsx` cannot export named symbols (Next.js page constraint). All pure logic goes into the existing `src/app/(onboarding)/model/selection.ts` module which is already the home for testable selection helpers.

Two new exports:
- `loadSessionsDefaultModel(): Promise<{ id: string; provider: string } | null>` — sends `sessions.list` via the shared `send` helper pattern; returns `null` on failure
- `mergeSessionsDefaultModel(models: ModelOption[], defaultModel: { id: string; provider: string } | null): ModelOption[]` — pure function: if `defaultModel` is non-null and its normalized `id` is not already in `models`, prepends a synthetic `ModelOption`

**Why separate functions:** keeps fetching and merging independently testable.

### Decision 2: Synthetic entry structure

The missing default is inserted with:
- `id`: verbatim from `payload.defaults.model`
- `name`: same as `id` (no display name available from sessions response)
- `provider`: verbatim from `payload.defaults.modelProvider` (e.g. `"litellm"`)

No additional UI annotation beyond what the existing provider field already offers. The provider column visible in the dropdown already communicates that this is a different model origin.

**Why not show a special badge or label:** keeps `ModelOption` type stable and avoids UI complexity in this change.

### Decision 3: Synthetic entry is prepended, not appended

The sessions-default model represents what is already working in production. Placing it at the top of the list gives users the most relevant option immediately, consistent with the existing `configuredDefaultModelId` pre-selection behaviour that also targets the same position logically.

### Decision 4: `loadSessionsDefaultModel` calls `send` directly, not via a REST route

`sessions.list` is already a gateway WebSocket method. Using `send("sessions.list", {...})` is consistent with `send("models.list", {})` already in `loadModels`. No new REST route needed.

**Challenge:** `selection.ts` helpers are currently pure / async-over-fetch; `loadConfiguredDefaultModelId` hits `/api/gateway/config` via `fetch`. `loadSessionsDefaultModel` needs access to the `send` function from the gateway context. Unlike `loadConfiguredDefaultModelId`, it cannot be called outside of a component.

**Resolution:** `loadSessionsDefaultModel(send)` accepts `send` as a parameter. This matches how `send` is already threaded through `loadModels` via the closure in `page.tsx`. The helper remains pure/testable by injecting a mock `send`.

## Risks / Trade-offs

- **Sessions response is large and slow** → Mitigation: non-blocking via `Promise.allSettled`; total load time is bounded by the slower of `models.list` / `sessions.list`, not their sum since they run in parallel.
- **`sessions.list` model not in OpenRouter list by design** → Mitigation: the synthetic entry is only injected when the ID is absent; no duplicate risk.
- **`payload.defaults` may be absent from some OpenClaw versions** → Mitigation: `loadSessionsDefaultModel` returns `null` on any missing/malformed field; `mergeSessionsDefaultModel(models, null)` is a no-op.

## Migration Plan

1. Add `loadSessionsDefaultModel` and `mergeSessionsDefaultModel` to `selection.ts`
2. Update `loadModels` in `page.tsx`:
   - Add `loadSessionsDefaultModel(send)` to the `Promise.allSettled` (or extend existing `Promise.all` with a guarded wrapper)
   - Apply `mergeSessionsDefaultModel` to the fetched model list before `setModels`
3. Add unit tests for both new helpers
4. Build and test locally; verify the synthetic entry appears when sessions default is absent from models list

No rollback needed — the feature is additive. Removing the sessions fetch and merge restores prior behaviour exactly.
