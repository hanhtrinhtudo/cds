# Persistence Backend Deployment

Date: 2026-07-07

## Summary

Sprint 7.2B backend deployment is now verified. The frontend persistence integration is present and the endpoint resolver supports the required production variable order:

1. `VITE_PERSISTENCE_API_URL`
2. `VITE_APPS_SCRIPT_API_URL`
3. `VITE_LEGACY_AUTH_API_URL`

The local production environment now sets both `VITE_PERSISTENCE_API_URL` and `VITE_LEGACY_AUTH_API_URL` to the same persistence-enabled Apps Script deployment. The deployment returns the required persistence capability handshake.

## Required deployment configuration

Set the following variable in Netlify production and local `.env.production`:

```env
VITE_PERSISTENCE_API_URL=<persistence-enabled Apps Script /exec URL>
```

The value must be the Apps Script deployment that returns:

- `ok: true`
- `service: "persistence"`
- `supportsPersistence: true`
- `sheetsReady: true`
- `build: "7.1A-merged-auth-rc1"` or newer

Do not replace `VITE_LEGACY_AUTH_API_URL` unless the same Apps Script deployment also safely preserves existing login/register/admin actions.

## Deployment status

PASS.

Verified health summary:

- `ok: true`
- `service: "persistence"`
- `supportsPersistence: true`
- `sheetsReady: true`
- `build: "7.1A-merged-auth-rc1"`
- persistence actions advertised: 9

Live learner and admin smoke tests passed without changing frontend business logic.

## Safety notes

- No frontend business logic was changed.
- No Apps Script schema was changed.
- No destructive admin action was performed.
- No token, Script ID, Sheet ID, password, or deployment key is reproduced in this report.
