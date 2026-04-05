## Context

The dashboard now gets users through model selection, channel setup, identity configuration, and chat, but it still lacks a practical bridge into knowledge-connected assistant behavior. The configuration layer already exposes normalized `skills` branches, which gives the UI a stable place to read and write dashboard-managed skill settings, but there is no dedicated dashboard surface for those settings yet.

This change should add a high-value next step without expanding into a full integration platform. Users need clear, actionable setup surfaces for a small number of document-centric skills, while the implementation should stay compatible with the current gateway configuration model.

## Goals / Non-Goals

**Goals:**
- Add a dashboard section for data-skill setup after the identity flow.
- Present Google Drive, Google Docs, and file-based Q&A as individual skill cards with status and actions.
- Persist dashboard-managed skill settings using targeted gateway configuration writes.
- Make dependency relationships understandable, especially that file-based Q&A depends on at least one configured content source.
- Keep copy and labels localization-driven.

**Non-Goals:**
- Building full OAuth brokerage or token lifecycle infrastructure if the current gateway does not already provide it.
- Implementing background indexing orchestration, sync scheduling, or retrieval quality analytics in this change.
- Supporting a broad marketplace of arbitrary third-party skills in the first release.
- Replacing chat as the primary validation surface after setup.

## Decisions

1. Use a dashboard section with independent connector cards instead of a long single wizard
- Decision: Render Drive, Docs, and file Q&A as separate cards with focused status and actions.
- Rationale: Users can understand available capabilities at a glance and configure only what they need.
- Alternative considered: One sequential wizard for all data skills. Rejected because it forces unnecessary steps and becomes brittle as more skills are added.

2. Store dashboard-managed connector state under existing skills configuration branches
- Decision: Read and write data-skill settings through the normalized `skills` area already exposed by gateway config helpers.
- Rationale: This avoids introducing a parallel storage model and keeps writes compatible with existing optimistic-concurrency config flows.
- Alternative considered: Local-only UI state or a separate dashboard settings blob. Rejected because it would drift from the runtime configuration source of truth.

3. Treat file-based Q&A as a dependent skill with prerequisite guidance
- Decision: The file Q&A card remains configurable, but its ready state depends on at least one usable content source such as Drive or Docs being configured.
- Rationale: This matches the user mental model that Q&A on files needs actual documents behind it.
- Alternative considered: Treat file Q&A as fully independent from sources. Rejected because it hides an important prerequisite and would confuse users at runtime.

4. Keep v1 actions explicit and configuration-oriented
- Decision: First release actions emphasize connect/configure/enable flows and readiness indicators rather than claiming full automated ingestion.
- Rationale: This keeps the UI honest about current system capability while still giving users a practical setup path.
- Alternative considered: Marketing-style “connected” states without underlying configuration persistence. Rejected because it creates false confidence and weakens later implementation.

## Risks / Trade-offs

- [Risk] Users may expect full Google OAuth and live document sync immediately. -> Mitigation: use precise wording around configure/connect state and keep unsupported automation out of scope for v1.
- [Risk] Generic `skills` config branches may not yet encode all connector-specific metadata cleanly. -> Mitigation: keep first-pass data structures minimal and use targeted nested entries that can evolve without destructive config rewrites.
- [Trade-off] Separate cards are easier to scan but may duplicate small pieces of status UI. -> Mitigation: standardize card anatomy and status patterns across all three skills.

## Migration Plan

1. Add spec coverage for dashboard data-skill configuration behavior.
2. Implement dashboard card surfaces and config-backed status loading.
3. Add targeted save/update flows for data-skill settings and prerequisite-aware UI states.
4. Validate localization, responsive layout, and dashboard follow-up flow after identity completion.
5. Rollback strategy: hide the new data-skills section and leave existing dashboard/chat/identity flow intact without config migration.

## Open Questions

- Which exact config paths under `skills.entries` should be considered canonical for Drive, Docs, and file Q&A in v1?
- Does the gateway already expose any connector-specific validation or test action that the dashboard should surface?
- Should advanced connector details eventually live on the dashboard, or move to a dedicated settings area once the surface grows?