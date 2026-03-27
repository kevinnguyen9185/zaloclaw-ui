## ADDED Requirements

### Requirement: Dashboard redirects unauthenticated users to onboarding

If onboarding is not complete, visiting `/dashboard` must redirect to the wizard.

#### Scenario: Onboarding not completed

WHEN a user navigates to `/dashboard`
AND `localStorage` key `zaloclaw.onboarding.v1` does not contain `{ completed: true }`
THEN the browser is redirected to the onboarding wizard entry route

#### Scenario: Onboarding completed

WHEN `zaloclaw.onboarding.v1` contains `{ completed: true }`
THEN the dashboard renders without redirect

---

### Requirement: Gateway connection status badge

The dashboard header must show a real-time connection status indicator reflecting `GatewayContext.status`.

#### Scenario: Gateway connected

WHEN `GatewayContext.status` is `"connected"`
THEN the header shows a green badge labeled "Connected"

#### Scenario: Gateway disconnected or reconnecting

WHEN `GatewayContext.status` is `"connecting"` or `"error"`
THEN the header badge turns amber or red
AND shows a label matching the status (e.g., "Reconnecting…" or "Disconnected")

---

### Requirement: Dashboard shows active model

The dashboard must display the model currently in use for the assistant session.

#### Scenario: Model name is shown

WHEN the dashboard loads and the gateway is connected
THEN the dashboard calls `send("sessions.patch", {})` or reads snapshot data from `hello`
AND displays the active model's `name` and `provider`

---

### Requirement: Dashboard shows Zalo account status

The dashboard must surface the Zalo channel connection status.

#### Scenario: Zalo is connected

WHEN `send("channels.status", {})` returns a connected Zalo channel
THEN the dashboard shows the Zalo account label and a "Connected" badge

#### Scenario: Zalo is not configured

WHEN `channels.status` indicates Zalo is not connected
AND onboarding state shows `zalo: "skipped"`
THEN the dashboard shows a "Connect Zalo" prompt linking back to the pairing wizard step

---

### Requirement: Navigation to Settings area

The dashboard must provide navigation to a settings view where model and channel configuration can be revisited.

#### Scenario: Settings link is present

WHEN the dashboard is rendered
THEN a "Settings" navigation item is visible in the sidebar or header
AND clicking it navigates to `/(app)/settings`

#### Scenario: Settings page placeholder rendered

WHEN the user navigates to `/(app)/settings`
THEN a Settings page renders (may be a placeholder in this change)
AND no runtime error occurs
