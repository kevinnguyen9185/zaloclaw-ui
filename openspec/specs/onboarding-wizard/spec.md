## ADDED Requirements

### Requirement: Wizard state persisted across page reloads

Onboarding wizard state must be serialized to `localStorage` so that refreshing the browser resumes at the last completed step.

#### Scenario: User refreshes mid-wizard

WHEN a user has completed step 1 (gateway check) and refreshes the page
THEN the wizard loads at step 2 (model selection)
AND previously entered data is pre-populated

#### Scenario: Corrupt storage is discarded

WHEN `localStorage` key `zaloclaw.onboarding.v1` contains malformed JSON or fails schema validation
THEN the wizard starts from step 1 (gateway check)

---

### Requirement: Step 1 — Gateway health check

The first wizard step must verify the OpenClaw gateway is reachable and the WebSocket handshake succeeds.

#### Scenario: Gateway is healthy

WHEN the user opens the app and `GET /__openclaw/control-ui-config.json` returns HTTP 200
AND the WebSocket connects and `GatewayContext.status` is `"connected"`
THEN step 1 shows the assistant name and server version from the config JSON
AND the "Next" button is enabled

#### Scenario: Gateway is unreachable

WHEN `GET /__openclaw/control-ui-config.json` returns a network error
THEN step 1 shows an error state with a "Retry" button
AND the "Next" button remains disabled

---

### Requirement: Step 2 — Model selection

The user must select an LLM model from the list returned by the `models.list` WS method.

#### Scenario: Models load successfully

WHEN the gateway is connected and step 2 is active
THEN the wizard calls `send("models.list", {})` via the gateway client
AND displays a list of available models with their `name` and `provider`

#### Scenario: User selects a model

WHEN the user selects a model and clicks "Next"
THEN `send("sessions.patch", { model: <selectedModelId> })` is called
AND on success the wizard advances to step 3

#### Scenario: No models available

WHEN `models.list` returns an empty array
THEN the wizard shows an empty-state message
AND the "Next" button is disabled

#### Scenario: Model fetch fails

WHEN `models.list` rejects with an error
THEN an inline error message is shown with a "Retry" button

---

### Requirement: Step 3 — Zalo account pairing

The user must be able to initiate and complete Zalo channel pairing.

#### Scenario: Zalo channel status polled on step entry

WHEN the user enters step 3
THEN the wizard calls `send("channels.status", {})` to fetch current Zalo channel state
AND displays current pairing status (connected / not paired)

#### Note: `channels.status` response shape

The response payload has the following relevant structure:
- `payload.channels` — object keyed by channel id (e.g. `{ zalo: { running: boolean, ... } }`)
- `payload.channelAccounts` — object keyed by channel id with arrays of account objects

Zalo is considered connected when `payload.channels.zalo.running === true`.
The response does NOT contain a top-level `connected` boolean, and `channels` is NOT an array.

#### Scenario: Already paired

WHEN `channels.status` returns `payload.channels.zalo.running === true`
THEN step 3 shows a "Zalo connected" confirmation badge
AND the "Next" button is enabled immediately

#### Scenario: User initiates pairing

WHEN Zalo is not paired and the user clicks "Pair Zalo Account"
THEN the wizard starts the pairing flow using available WS channel methods
AND polls `channels.status` every 3 seconds to detect pairing completion

#### Scenario: Pairing succeeds

WHEN `channels.status` transitions to a connected state during polling
THEN step 3 shows a success badge
AND the "Next" button becomes enabled

#### Scenario: User skips pairing

WHEN the user clicks "Skip for now"
THEN the wizard advances to step 4 without Zalo configured
AND the wizard state records `zalo: "skipped"`

---

### Requirement: Step 4 — Onboarding complete

The final wizard step must show a summary and persist all onboarding complete state.

#### Scenario: Summary screen rendered

WHEN the user reaches step 4
THEN the wizard displays the selected model name and Zalo status (connected or skipped)
AND shows a "Go to Dashboard" button

#### Scenario: Mark onboarding complete

WHEN the user clicks "Go to Dashboard"
THEN `localStorage` key `zaloclaw.onboarding.v1` is updated with `{ completed: true }`
AND the user is navigated to `/(app)/dashboard`

---

### Requirement: Step progress indicator visible throughout wizard

A progress bar or step indicator must show the user's current position in the wizard at all times.

#### Scenario: Step indicator updates on advance

WHEN the wizard advances from step N to step N+1
THEN the step indicator reflects the new current step
AND previously completed steps are visually marked as done
