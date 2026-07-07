# Sprint 7.1 Organization Domain Report

## Executive summary

Sprint 7.1 created the Enterprise Military Organization Domain foundation for PTKV3.

Implemented in repo:

- Typed organization model.
- Seeded military command tree.
- Alias resolver with required Vietnamese unit aliases.
- Legacy Apps Script-compatible organization service.
- Admin Organization Explorer UI.
- Optional organization fields in legacy user normalization.
- Exact Apps Script patch and migration plan.

Final status: `PARTIAL_BACKEND_PATCH_REQUIRED`.

Reason: the deployed Apps Script source is not present in this repository, so the frontend/domain foundation is complete but live sheet creation, idempotent migration, and admin write actions require deploying `ORGANIZATION_APPS_SCRIPT_PATCH.gs.md`.

## Files changed

- `src/types.ts`
- `src/types/organization.ts`
- `src/services/authService.ts`
- `src/services/apiClient.ts`
- `src/services/organizationService.ts`
- `src/components/AdminPanel.tsx`

## Documentation created

- `ORGANIZATION_DOMAIN_ARCHITECTURE.md`
- `ORGANIZATION_TREE_SPEC.md`
- `ORGANIZATION_ALIAS_SPEC.md`
- `ORGANIZATION_MIGRATION_PLAN.md`
- `ORGANIZATION_SCOPE_PERMISSION.md`
- `ADMIN_ORGANIZATION_GUIDE.md`
- `ADMIN_ACCOUNT_SETUP.md`
- `ADMIN_ANALYTICS_REQUIREMENTS.md`
- `ORGANIZATION_APPS_SCRIPT_PATCH.gs.md`

## Data model created

Sheets required:

- `Organizations`
- `OrganizationAliases`
- `UserOrganizations`
- `OrganizationAudit`

Legacy `Users.Đơn vị` remains unchanged for backward compatibility.

## APIs added to frontend service

- `organization_tree`
- `organization_search`
- `organization_resolve`
- `organization_alias_list`
- `organization_alias_add`
- `organization_merge`
- `organization_members`
- `organization_stats`
- `admin_migrate_user_organizations`

## Migration behavior

`migrateUserOrganizations()` is designed to:

- read current users
- resolve unit text
- create `UserOrganizations` rows
- skip existing links on rerun
- keep legacy unit text unchanged
- return unresolved unit names

Frontend displays backend-patch-required status if the live Apps Script action is unavailable.

## Compatibility notes

- Register payload remains `{ name, username, unit, password }`.
- Login response remains compatible with existing fields.
- Optional fields now supported: `organizationId`, `organizationName`, `organizationPath`, `scopeLevel`.
- Existing learner UI and data flows are not changed.

## Alias validation

Local resolver maps:

- `Phòng Hậu cần - Kỹ thuật` → `ORG_HCKT`
- `Phòng HCKT` → `ORG_HCKT`
- `phong thammuu` → `ORG_THAMMUU`
- `Phòng chính trị` → `ORG_CHINHTRI`

## Remaining risks

- Live Apps Script must be patched before production migration.
- Apps Script admin identity helper names may differ; the patch includes integration comments for existing dispatchers.
- Learning/exam/news/AI analytics by organization require backend result/activity storage actions in a later sprint.

## Validation result

- `npm run lint`: PASS
- `npm run build`: PASS
- Vite preview HTTP check: PASS (`http://127.0.0.1:4173` returned HTTP 200)

Note: a new hidden preview process could not be spawned by PowerShell due local access policy, but the preview endpoint was live and returned 200.

## Final status

`PARTIAL_BACKEND_PATCH_REQUIRED`
