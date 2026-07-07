# Organization Migration Plan

## Purpose

`admin_migrate_user_organizations` reads legacy `Users.Đơn vị`, resolves it through aliases, and creates `UserOrganizations` links.

## Safety

- Idempotent: reruns skip existing `UserID + OrganizationID + IsPrimary` links.
- Does not edit or remove the legacy `Users.Đơn vị` text.
- Logs unresolved unit names.
- Logs each run to `OrganizationAudit`.

## Steps

1. Deploy `ORGANIZATION_APPS_SCRIPT_PATCH.gs.md` to the Auth Apps Script project.
2. Run `organization_tree` and `organization_alias_list` to verify sheets exist.
3. Login as admin normally.
4. Open Admin → Tổ chức.
5. Run Đồng bộ tài khoản vào tổ chức.
6. Review unresolved units and add aliases if needed.
7. Rerun migration safely.

## Rollback

Do not delete legacy unit text. If a bad alias is added, mark alias inactive and rerun migration after correcting links manually or via `organization_merge`.
