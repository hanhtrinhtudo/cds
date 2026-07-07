# Analytics API Contract

Endpoint: merged Apps Script `/exec`

## Health

`analytics.health`

Expected:

- `ok: true`
- `service: "analytics"`
- `supportsAnalytics: true`
- `apiVersion >= 1`
- `schemaVersion >= 1`
- `sheetsReady: true`
- `actions`

## Learner actions

- `analytics.event.log`
- `analytics.events.mine`

Both require token. User ownership comes from token.

## Admin actions

- `analytics.events.adminList`
- `analytics.summary.admin`
- `analytics.summary.user`
- `analytics.summary.unit`
- `analytics.peqi.user`
- `analytics.peqi.unit`

Require admin/chỉ huy scope.

## Frontend behavior

If `analytics.health` does not return `supportsAnalytics=true`, the app continues normally and no learner alert is shown.

