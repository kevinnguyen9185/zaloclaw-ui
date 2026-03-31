## 1. Normalize Zalo setup state

- [ ] 1.1 Identify and document the normalized fields used to determine Zalo configured/paired readiness in the config model.
- [ ] 1.2 Add or adjust normalization defaults so Zalo readiness checks are safe when channel branches are partially missing.

## 2. Update Zalo configuration UX and validation

- [ ] 2.1 Implement conditional bot token requirement in the Zalo configuration screen when Zalo is unconfigured or unpaired.
- [ ] 2.2 Add blocking validation and clear inline feedback so submit is disabled or rejected until required token input is provided.
- [ ] 2.3 Preserve non-blocking behavior for already configured and paired states so users are not forced to re-enter unchanged token values.

## 3. Persist channels.zalo via config.set

- [ ] 3.1 Update config write helpers to generate targeted updates for `channels.zalo` only.
- [ ] 3.2 Ensure parent branch creation is handled when `channels` or `channels.zalo` is absent in the current snapshot.
- [ ] 3.3 Keep read-after-write refresh behavior so updated Zalo status is reflected immediately after successful save.

## 4. Verification and safeguards

- [ ] 4.1 Add or update unit/component tests for configured/unconfigured and paired/unpaired prompt/validation behavior.
- [ ] 4.2 Add or update tests that assert `config.set` writes are path-targeted to `channels.zalo` and non-destructive to unrelated branches.
- [ ] 4.3 Run test/lint checks for touched areas and document any follow-up fixes required before apply completion.