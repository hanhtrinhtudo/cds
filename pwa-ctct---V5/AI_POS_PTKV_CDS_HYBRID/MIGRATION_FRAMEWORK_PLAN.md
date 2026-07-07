# Migration Framework Plan

## Capability markers

The prepared health contract advertises:

```json
{
  "localRecoverySupported": true,
  "requiresUserConfirmationForLegacyImport": true,
  "migrationKeyPrefix": "ptkv_persistence_migration_"
}
```

These are capability markers only. Sprint 7.1A does not read, transform, or upload localStorage.

## Future guarded migration

1. Require a normal authenticated session and successful persistence handshake.
2. Detect legacy local review/progress evidence without mutating it.
3. Explain which records can and cannot be attributed confidently.
4. Require explicit user confirmation before upload.
5. Generate a per-user migration key using the prefix and schema version.
6. Submit records with stable idempotency keys.
7. Verify remote reads before marking migration complete.
8. Retain legacy local data until verified; never silently delete it.

## Ownership limitation

Existing global review keys do not contain UserID. They must not be automatically assigned to the currently signed-in account. Ambiguous records remain device-only unless the user confirms ownership through a future recovery UI.

## Not implemented

- No automatic import.
- No frontend synchronization.
- No UI prompt.
- No localStorage key change.
- No cleanup or deletion.

