# Organization Scope Permission Foundation

Sprint 7.1 creates scope helpers and documentation only. It does not rewrite permissions.

## Scope levels

- `GLOBAL`
- `MILITARY_REGION`
- `PROVINCE`
- `AREA`
- `COMMUNE`
- `DEPARTMENT`
- `UNIT`
- `TEAM`
- `SELF`

## Rules

| Role | Scope |
| --- | --- |
| admin | GLOBAL |
| chi-huy | assigned organization scope |
| political_officer | assigned organization and descendants |
| member/learner | SELF |

## Future enforcement

Backend actions that return users, progress, exam results, AI usage or news activity should filter by `OrganizationScope`. Frontend must not rely on client-only filtering for security.
