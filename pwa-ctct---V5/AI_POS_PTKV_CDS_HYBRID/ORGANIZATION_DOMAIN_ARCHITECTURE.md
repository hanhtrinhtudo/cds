# Organization Domain Architecture

Sprint 7.1 adds a canonical military organization domain for PTKV3 while preserving legacy Apps Script authentication and the existing `Users.Đơn vị` text column.

## Goals

- Normalize unit names into a command hierarchy.
- Support command dashboards and analytics by organization scope.
- Preserve current learner login, register, exam, learning, news and AI flows.
- Add non-breaking fields to user profiles: `organizationId`, `organizationName`, `organizationPath`, `scopeLevel`.

## Frontend architecture

- Types: `src/types/organization.ts`
- Service: `src/services/organizationService.ts`
- Admin UI: `src/components/AdminPanel.tsx`

The service supports legacy Apps Script mode and falls back to the seeded organization tree for read-only display if the backend patch has not yet been deployed.

## Backend architecture

The Apps Script backend must add four sheets:

- `Organizations`
- `OrganizationAliases`
- `UserOrganizations`
- `OrganizationAudit`

The required patch is documented in `ORGANIZATION_APPS_SCRIPT_PATCH.gs.md`.

## Compatibility

Register payload remains exactly:

```json
{ "name": "...", "username": "...", "unit": "...", "password": "..." }
```

Login response remains backward-compatible and may add optional organization fields.
