## 1. Helpers in selection.ts

- [x] 1.1 Add `SendFn` type alias (or reuse existing gateway send signature) to `selection.ts` to type the injected `send` parameter
- [x] 1.2 Add `extractSessionsDefaultModel(payload: unknown): { id: string; provider: string } | null` — reads `payload.defaults.model` and `payload.defaults.modelProvider`; returns `null` on missing/malformed input
- [x] 1.3 Add `loadSessionsDefaultModel(send: SendFn): Promise<{ id: string; provider: string } | null>` — calls `send("sessions.list", { includeGlobal: true, includeUnknown: true })`, delegates to `extractSessionsDefaultModel`, returns `null` on any error
- [x] 1.4 Add `mergeSessionsDefaultModel(models: ModelOption[], defaultModel: { id: string; provider: string } | null): ModelOption[]` — pure function: if `defaultModel` is non-null and its normalized `id` is absent from `models`, prepend a synthetic `ModelOption` at position 0; otherwise return `models` unchanged

## 2. Page wiring

- [x] 2.1 Import `loadSessionsDefaultModel` and `mergeSessionsDefaultModel` from `selection.ts` in `page.tsx`
- [x] 2.2 In `loadModels`, extend the `Promise.all` to include `loadSessionsDefaultModel(send)` wrapped in a `.catch(() => null)` so it never rejects
- [x] 2.3 After resolving `normalizeModels(response)`, call `mergeSessionsDefaultModel(nextModels, sessionsDefault)` to produce the final model list passed to `setModels`

## 3. Tests

- [x] 3.1 Test `extractSessionsDefaultModel`: returns `null` for non-object, missing `defaults`, missing `model`; returns `{ id, provider }` for valid `payload.defaults`
- [x] 3.2 Test `mergeSessionsDefaultModel`: no-op when `defaultModel` is `null`; no duplicate when id already present (case-insensitive); prepends synthetic entry when id absent; preserves original list order after prepend
- [x] 3.3 Test `loadSessionsDefaultModel`: resolves to `null` when `send` throws; resolves to `null` on malformed response; resolves to `{ id, provider }` on well-formed response

## 4. Validation

- [x] 4.1 Run `npm test` — all tests pass
- [x] 4.2 Run `npm run build` — no build errors
- [ ] 4.3 Manual smoke test: connect to a real OpenClaw instance serving `sessions.list` with a `defaults.model`; confirm the non-OpenRouter model appears at the top of the dropdown
