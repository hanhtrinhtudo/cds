# Admin Organization Guide

## Where to find it

Admin → Tổ chức.

## Panels

- Command Center Header: shows total members, active members, pending accounts and organizations.
- Organization Explorer: tree view with selected organization state.
- Organization Detail: canonical name, path, scope, status, aliases and member counters.
- Alias panel: add aliases to improve future unit resolution.
- Migration panel: runs idempotent user-to-organization synchronization.

## Current backend status

The frontend is ready. Live write/migration actions require the Apps Script patch in `ORGANIZATION_APPS_SCRIPT_PATCH.gs.md`.

## Safe operation

Do not use merge/deactivate actions on production data until the Organizations sheets have been backed up.
