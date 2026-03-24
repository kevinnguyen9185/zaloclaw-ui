## Context

OpenClaw exposes a WebSocket-first control API on port 18789. The existing Control UI (Vite + Lit) is a general-purpose admin dashboard. Zalo Claw UI is a purpose-built second front-end on top of the same gateway, targeting non-technical Zalo AI assistant users.

Key facts discovered from API investigation:
- `/health` and `/healthz` return `{"ok":true,"status":"live"}` — unauthenticated, usable for polling
- `/__openclaw/control-ui-config.json` returns bootstrap meta (assistant name, serverVersion) — unauthenticated
- WebSocket upgrade succeeds on any non-404 path; `ws://localhost:18789` is the canonical target
- Gateway sends `connect.challenge` immediately on WS connect, client must reply with `connect.params` containing `auth.token`
- Localhost connections are auto-approved (no device pairing required)
- WS methods for onboarding: `models.list`, `sessions.patch`, `config.get`/`config.set`/`config.patch`, `channels.status`, `skills.status`
- Future agent management: `agents.list/create/update/delete`, `agents.files.get/set`, `tools.catalog`, `skills.status/install/update`

## Goals / Non-Goals

**Goals:**
- Working Next.js 15 App Router project with Tailwind CSS + shadcn/ui
- Browser-to-gateway direct WebSocket connection (no server-side proxy)
- Onboarding wizard that completes in a single session
- Persistent onboarding state (survives browser reload mid-wizard)
- Dashboard home screen after onboarding
- Clean abstractions that support agent management features in future changes

**Non-Goals:**
- Replacing or modifying the existing OpenClaw Control UI
- Remote gateway access (Tailscale, HTTPS proxy) — localhost only for v1
- Multi-user or multi-gateway support
- Agent management UI (future change)
- Mobile-first layout

## Decisions

### D1: Browser-direct WebSocket, no server-side proxy

**Decision**: The Next.js app connects the browser directly to `ws://localhost:18789`. Next.js route handlers are used only for the `/health` unauthenticated HTTP ping.

**Rationale**: The OpenClaw gateway is on the same machine as the browser (localhost). Adding a Node.js WebSocket proxy adds latency, complexity, and a stateful server process for no benefit. The existing Control UI uses the same browser-direct model.

**Alternatives considered**:
- *BFF proxy*: Simpler to reason about from a security standpoint but adds a stateful server, which is unnecessary for a local tool.

---

### D2: WS client as a singleton React context

**Decision**: One WebSocket connection shared app-wide via React context. Components subscribe to events and issue requests through the context.

**Rationale**: The gateway protocol has a single challenge/auth handshake then a stateful event stream. Multiple connections per component would waste resources and cause event duplication.

**Shape** (not an implementation contract):
```
GatewayProvider
  ├── connection state: idle | connecting | authenticating | connected | error
  ├── send(method, params) → Promise<result>
  └── subscribe(event, handler) → unsubscribe fn
```

---

### D3: Onboarding wizard as a finite state machine

**Decision**: Wizard steps are modeled as a state machine: `check-gateway → select-model → pair-zalo → complete`. Each step has an explicit `idle | pending | success | error` status for its async action.

**Rationale**: Onboarding has strict step ordering, async backend calls per step, and a resume-from-reload requirement. A state machine makes transitions explicit and prevents illegal state combinations.

**Persistence**: Wizard state serialized to `localStorage` as `zaloclaw.onboarding.v1`. On app load, resume from last saved step if not `complete`.

---

### D4: shadcn/ui components, not a custom design system

**Decision**: Use shadcn/ui's copy-owned components (Button, Card, Select, Progress, Badge, etc.) styled with Tailwind CSS utility classes.

**Rationale**: Fastest path to polished UI. Components are owned (copied into `src/components/ui/`), not a runtime dependency, so breakage risk is low. Onboarding wizard screens map cleanly to Card + Form patterns.

---

### D5: Auth token stored in sessionStorage

**Decision**: Gateway auth token stored in `sessionStorage` only (scoped to tab, cleared on close).

**Rationale**: Localhost-only tool, auto-approved on connect. Storing tokens in `localStorage` would persist them across browser profiles unnecessarily. Matches the behavior of the original Control UI for token handling.

---

### D6: Next.js App Router with route groups

**Decision**:
```
app/
  (onboarding)/
    page.tsx          ← wizard root (redirects based on state)
    check/page.tsx    ← step 1: gateway check
    model/page.tsx    ← step 2: model selection
    zalo/page.tsx     ← step 3: Zalo pairing
    complete/page.tsx ← step 4: done
  (app)/
    dashboard/page.tsx
  layout.tsx
```

**Rationale**: Route groups keep onboarding and post-onboarding layouts separate. App Router's loading/error boundaries provide graceful async UX with minimal boilerplate.

## Risks / Trade-offs

- **WS method signature changes in future OpenClaw versions** → Mitigation: version-check via `/__openclaw/control-ui-config.json` `serverVersion` field; gate on semver compatibility check before connecting.
- **Zalo channel pairing flow variability** → Mitigation: use `channels.status` to poll pairing state; treat QR/OTP as opaque flows surfaced from backend responses rather than hardcoded in UI.
- **Onboarding localStorage corruption** → Mitigation: validate schema on parse; fall back to fresh start if invalid.
- **CSP on the OpenClaw gateway (`connect-src 'self' ws: wss:`)** → Already permissive for ws:// connections; no action needed for localhost.

## Open Questions

- Does the Zalo channel express QR code pairing or token-based? Need to inspect `channels.status` response shape at runtime to finalize the pairing step UI.
- Should the dashboard show a live chat widget (reusing `chat.send` / `chat.history`)? Deferred to a future change.
