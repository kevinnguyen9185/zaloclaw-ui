## ADDED Requirements

### Requirement: Initialize Next.js 15 project with App Router

The repository must be a Next.js 15 project bootstrapped with TypeScript, ESLint, and the App Router.

#### Scenario: Developer runs `npm run dev` on a fresh clone

WHEN a developer clones the repository and runs `npm install && npm run dev`
THEN the dev server starts without errors on port 3000
AND opening `http://localhost:3000` returns an HTTP 200 response

#### Scenario: Developer runs `npm run build`

WHEN running `npm run build` on a clean checkout
THEN the build completes without TypeScript errors or ESLint violations

---

### Requirement: Tailwind CSS v4 configured

Tailwind CSS must be installed and the global stylesheet must import the Tailwind base layers.

#### Scenario: Tailwind utility classes render correctly

WHEN a component applies the class `text-zinc-900 bg-white`
THEN the browser renders white background with near-black text

---

### Requirement: shadcn/ui components initialized

The project must have `shadcn/ui` initialized with the `tsconfig.json` path alias `@/` pointing to `src/`.

#### Scenario: Button component is available

WHEN the developer runs `npx shadcn add button`
THEN `src/components/ui/button.tsx` is created and can be imported as `@/components/ui/button`

---

### Requirement: Folder structure follows App Router conventions

The source folder layout must match the design decision D6 route groups.

#### Scenario: Expected directories exist

WHEN inspecting the project root
THEN the following paths exist:
- `src/app/(onboarding)/`
- `src/app/(app)/`
- `src/components/ui/`
- `src/lib/`

---

### Requirement: Environment variable for gateway URL

The WebSocket gateway URL must be configurable via a Next.js public environment variable so it can be overridden without code changes.

#### Scenario: Default points to localhost

WHEN no `.env.local` is present
THEN `NEXT_PUBLIC_GATEWAY_URL` resolves to `ws://localhost:18789`

#### Scenario: Override via .env.local

WHEN `.env.local` contains `NEXT_PUBLIC_GATEWAY_URL=ws://192.168.1.5:18789`
THEN the gateway client reads that override value at startup
