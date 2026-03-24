## 1. Project Scaffold

- [ ] 1.1 Bootstrap Next.js 15 project with TypeScript, ESLint, and App Router using `create-next-app`
- [ ] 1.2 Install and configure Tailwind CSS v4
- [ ] 1.3 Initialize shadcn/ui with `npx shadcn init` — set `@/` alias to `src/`
- [ ] 1.4 Add shadcn components: `button`, `card`, `badge`, `select`, `progress`, `separator`
- [ ] 1.5 Create `(onboarding)` and `(app)` route groups under `src/app/`
- [ ] 1.6 Create `src/lib/` directory and add `env.ts` exporting `GATEWAY_URL` with `ws://localhost:18789` default
- [ ] 1.7 Add `.env.local.example` documenting `NEXT_PUBLIC_GATEWAY_URL`
- [ ] 1.8 Verify `npm run build` completes without TypeScript or ESLint errors

## 2. Gateway Client

- [ ] 2.1 Create `src/lib/gateway/types.ts` — define `ConnectionStatus`, `RpcRequest`, `RpcResponse`, `GatewayEvent` types
- [ ] 2.2 Create `src/lib/gateway/client.ts` — implement `GatewayClient` class with WebSocket lifecycle (connect, disconnect, reconnect with exponential backoff)
- [ ] 2.3 Implement challenge/auth handshake in `GatewayClient`: receive `connect.challenge`, reply with `connect.params`, receive `hello`, persist token to `sessionStorage`
- [ ] 2.4 Implement `send(method, params): Promise<result>` with request ID correlation and error rejection
- [ ] 2.5 Implement `subscribe(event, handler)` and return unsubscribe function
- [ ] 2.6 Implement reconnect loop: exponential backoff (1 s → 2 s → 4 s … max 30 s), replay handshake on reconnect
- [ ] 2.7 Create `src/lib/gateway/context.tsx` — `GatewayProvider` React context wrapping `GatewayClient`, exposing `{ status, error, send, subscribe }`
- [ ] 2.8 Add `<GatewayProvider>` to `src/app/layout.tsx`
- [ ] 2.9 Write unit tests for `send` promise resolution and reconnect logic

## 3. Onboarding Wizard State

- [ ] 3.1 Create `src/lib/onboarding/types.ts` — define `OnboardingState` type with `step`, `model`, `zalo`, `completed` fields
- [ ] 3.2 Create `src/lib/onboarding/storage.ts` — `loadOnboardingState()` and `saveOnboardingState()` with JSON parse + schema validation, fall back to fresh state on error
- [ ] 3.3 Create `src/lib/onboarding/context.tsx` — `OnboardingProvider` with state machine transitions (`advance`, `setModel`, `setZalo`, `reset`)
- [ ] 3.4 Add `<OnboardingProvider>` to `src/app/(onboarding)/layout.tsx`

## 4. Onboarding Wizard UI

- [ ] 4.1 Create `src/app/(onboarding)/layout.tsx` — shared wizard shell with step progress indicator (4 steps)
- [ ] 4.2 Create `src/app/(onboarding)/page.tsx` — redirect to current wizard step based on `OnboardingState.step`
- [ ] 4.3 Create `src/app/(onboarding)/check/page.tsx` — Step 1: fetch `/__openclaw/control-ui-config.json`, show assistant name + version, show WS connection status, "Next" enabled when `status === "connected"`
- [ ] 4.4 Create `src/app/(onboarding)/model/page.tsx` — Step 2: call `send("models.list", {})`, render model list select, call `send("sessions.patch", { model })` on "Next"
- [ ] 4.5 Create `src/app/(onboarding)/zalo/page.tsx` — Step 3: call `send("channels.status", {})`, show connected/not-paired state, poll every 3 s, "Skip for now" button sets `zalo: "skipped"`
- [ ] 4.6 Create `src/app/(onboarding)/complete/page.tsx` — Step 4: show selected model + Zalo status summary, on "Go to Dashboard" set `completed: true` in storage and redirect to `/dashboard`
- [ ] 4.7 Implement step progress indicator component at `src/components/onboarding/StepProgress.tsx`

## 5. Dashboard Shell

- [ ] 5.1 Create `src/app/(app)/layout.tsx` — shared layout with sidebar/header navigation; redirect to onboarding if not `completed: true`
- [ ] 5.2 Create `src/app/(app)/dashboard/page.tsx` — main dashboard page
- [ ] 5.3 Implement `GatewayStatusBadge` component at `src/components/dashboard/GatewayStatusBadge.tsx` — reads `GatewayContext.status`, renders colored badge
- [ ] 5.4 Implement `ActiveModelCard` component — calls `send("sessions.patch", {})` or reads `hello` snapshot, displays model `name` and `provider`
- [ ] 5.5 Implement `ZaloStatusCard` component — calls `send("channels.status", {})`, shows connected badge or "Connect Zalo" prompt
- [ ] 5.6 Create `src/app/(app)/settings/page.tsx` — placeholder Settings page (no error on render)
- [ ] 5.7 Add "Settings" navigation link in the dashboard layout sidebar/header

## 6. Integration and Verification

- [ ] 6.1 End-to-end smoke test: open app → complete wizard → reach dashboard — no console errors
- [ ] 6.2 Test localStorage resume: refresh browser mid-wizard at step 2 → confirm wizard resumes at step 2
- [ ] 6.3 Test gateway disconnect: kill OpenClaw process → confirm dashboard shows "Disconnected" badge and reconnects when process restarts
- [ ] 6.4 Test corrupt onboarding storage: manually corrupt `zaloclaw.onboarding.v1` → confirm wizard restarts from step 1 without crash
- [ ] 6.5 Run `npm run build` on final implementation and confirm zero errors
