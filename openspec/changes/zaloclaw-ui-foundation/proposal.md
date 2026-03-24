## Why

There is no user-facing UI purpose-built for the Zalo AI assistant use case. The existing OpenClaw Control UI is a general-purpose admin dashboard; it requires technical knowledge to set up a model and connect a Zalo account, making it inaccessible to non-technical users. Zalo Claw UI fills that gap by providing a focused, onboarding-first experience that gets users from zero to a connected, running AI assistant in a single session.

## What Changes

- New standalone Next.js web application in this repository (`zaloclaw-ui`)
- Onboarding wizard: gateway connectivity check → model selection → Zalo account pairing → confirmation
- OpenClaw WebSocket gateway client (browser-side, direct connection to `ws://localhost:18789`)
- Dashboard shell (post-onboarding home screen with live status: connection health, active model, paired accounts)
- Project scaffolding: Next.js 15 App Router, Tailwind CSS, shadcn/ui component library, TypeScript

## Capabilities

### New Capabilities

- `project-scaffold`: Next.js 15 + Tailwind CSS + shadcn/ui project initialization, folder structure, base config, and dev tooling
- `gateway-client`: Browser-side WebSocket client for the OpenClaw gateway — connection lifecycle, challenge/auth handshake, RPC request/response, real-time event subscription
- `onboarding-wizard`: Multi-step setup wizard: gateway reachability check, model selection, Zalo channel pairing, and onboarding completion state
- `dashboard-shell`: Post-onboarding home screen showing gateway health badge, active model display, paired Zalo account status, and navigation shell

### Modified Capabilities

## Impact

- New project root in this repository; no existing code is modified
- Runtime dependency on OpenClaw gateway at `http://localhost:18789` (configurable)
- Browser connects directly via WebSocket — no Next.js server-side proxy required for core features
- Node.js BFF route handlers used only for `/api/health` polling (unauthenticated ping to OpenClaw `/health`)
- Token/auth stored in `sessionStorage` (tab-scoped), never persisted to `localStorage` or server
