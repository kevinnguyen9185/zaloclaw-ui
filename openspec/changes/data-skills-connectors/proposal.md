## Why

After bot identity is configured, users still need a direct way to connect their own knowledge sources so the assistant can answer from real documents. The dashboard currently stops at identity and chat, leaving no clear path to set up high-value data skills such as Google Drive, Google Docs, or file-based Q&A.

## What Changes

- Add a dedicated dashboard section for user-facing data skills setup after the identity flow.
- Provide first-pass connector cards for Google Drive, Google Docs, and file-based Q&A.
- Show per-skill readiness state and clear configure/connect actions from the dashboard.
- Persist data-skill settings through gateway-managed configuration using targeted updates.
- Keep the first release focused on dashboard configuration surfaces and skill readiness, not full ingestion automation or complex external admin tooling.

## Capabilities

### New Capabilities
- `dashboard-data-skills`: Dashboard experience for configuring document-oriented skills such as Google Drive, Google Docs, and file-based Q&A.

### Modified Capabilities

## Impact

- Affected code: dashboard components under `src/components/dashboard/`, dashboard page composition under `src/app/(app)/dashboard/`, and localization resources.
- Affected state/configuration: gateway config normalization and targeted config update flows for dashboard-managed skill settings.
- Affected UI behavior: new post-identity configuration section with connector states, actions, and prerequisite messaging.
- Dependencies/systems: existing gateway `config.get` / `config.set` flows and current `skills` branches in normalized OpenClaw config.