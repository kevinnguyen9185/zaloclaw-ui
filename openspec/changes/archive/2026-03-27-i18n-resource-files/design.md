## Context

The application currently renders user-facing text directly in components, which makes language expansion expensive and inconsistent. The immediate product need is Vietnamese-first experience while preserving a clean path to English and future locales.

Current constraints:
- Next.js App Router with mixed server/client components.
- Existing UI copy spans dashboard, onboarding, and settings surfaces.
- No backend locale negotiation requirement; language can be client-selected.

Stakeholders:
- Product/design team (copy quality and tone consistency)
- Frontend engineers (safe migration from hard-coded strings)
- Vietnamese-first users (default locale expectations)

## Goals / Non-Goals

**Goals:**
- Introduce a resource-file-based localization architecture.
- Set Vietnamese (`vi`) as default locale.
- Provide deterministic fallback for missing keys.
- Migrate primary user-visible surfaces (dashboard, onboarding, settings) to translation keys.
- Keep implementation incremental and low-risk.

**Non-Goals:**
- Runtime machine translation.
- Server-side locale negotiation via headers/cookies in v1.
- Full content-management workflow for translators.
- Localization of gateway protocol messages returned from backend.

## Decisions

1. Decision: Resource files stored by locale and namespace in source control.
- Choice: `src/locales/<locale>/<namespace>.json` (for example `common`, `dashboard`, `onboarding`, `settings`).
- Rationale: Clear ownership, easy review in PRs, low operational complexity.
- Alternative considered: Single monolithic file per locale.
  - Rejected due to merge conflicts and poor discoverability.

2. Decision: Vietnamese default locale with local override persistence.
- Choice: Default locale resolved to `vi`; user preference stored in localStorage.
- Rationale: Matches target audience expectation and request.
- Alternative considered: English default.
  - Rejected because it conflicts with product positioning for Vietnamese-first users.

3. Decision: Lightweight frontend i18n runtime (provider + `t()` helper).
- Choice: Add app-level LocalizationProvider and key-based lookup helper.
- Rationale: Minimal dependency surface and enough capability for current UI.
- Alternative considered: Full i18n framework with routing-level locale segments.
  - Rejected for v1 to avoid cross-cutting route changes and migration overhead.

4. Decision: Fallback behavior for missing keys.
- Choice: Fallback chain `selected locale -> vi -> key string`.
- Rationale: Prevents blank UI and supports safe incremental migration.
- Alternative considered: Throw errors on missing keys.
  - Rejected for runtime resilience; strictness can be enforced in CI linting later.

5. Decision: Namespace-based migration strategy.
- Choice: Migrate dashboard, onboarding, settings first.
- Rationale: Highest user-facing impact with manageable scope.
- Alternative considered: Global all-at-once migration.
  - Rejected due to high regression risk and review complexity.

## Risks / Trade-offs

- [Risk] Key sprawl and naming inconsistency
  -> Mitigation: Define key naming convention (`section.block.label`) and add review checklist.

- [Risk] Missing translations during migration
  -> Mitigation: Fallback chain and optional runtime warning in development mode.

- [Risk] Server/client boundary issues in translation helper usage
  -> Mitigation: Keep translation dictionaries serializable and provider-compatible for app shell.

- [Risk] Copy drift between Vietnamese and English
  -> Mitigation: Namespace ownership and explicit translation review in PR process.

## Migration Plan

1. Introduce locale types, resource loader, provider, and translation helper.
2. Add Vietnamese and English resource files for target namespaces.
3. Wire provider in root/app layout with default `vi` resolution.
4. Migrate dashboard copy to translation keys.
5. Migrate onboarding copy to translation keys.
6. Migrate settings copy to translation keys.
7. Add smoke validation for missing-key fallback and locale persistence.

Rollback strategy:
- Revert provider wiring and translation-key component changes.
- Keep resources as inert files if rollback happens before full adoption.

## Open Questions

- Should language selection UI live in settings only, or also in app shell header?
- Do we need pluralization and interpolation support in v1, or plain key lookup is sufficient?
- Should we add static lint validation for missing keys in CI as part of this change or follow-up?