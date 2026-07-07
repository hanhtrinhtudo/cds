# Sprint 7.2B — Backend Deployment & Live Verification Report

Date: 2026-07-07

## Executive summary

Sprint 7.2B is complete. The production env now points both `VITE_PERSISTENCE_API_URL` and `VITE_LEGACY_AUTH_API_URL` to the persistence-enabled Apps Script deployment. Health, learner persistence writes, logout/login remote reads, offline queue replay, and admin regression all passed.

Final decision: `ENTERPRISE_PERSISTENCE_PASS`

## Files inspected

- `.env.production`
- `.env.example`
- `.env.backup.hosted`
- `.env.demo-rc1-backup`
- `netlify.toml`
- `src/services/persistenceService.ts`
- `src/services/offlineSyncQueue.ts`
- prior persistence reports under `AI_POS_PTKV_CDS_HYBRID/`

## Files changed

Documentation/report updates:

- `AI_POS_PTKV_CDS_HYBRID/PERSISTENCE_BACKEND_DEPLOYMENT.md`
- `AI_POS_PTKV_CDS_HYBRID/PERSISTENCE_ENDPOINT_CONFIGURATION.md`
- `AI_POS_PTKV_CDS_HYBRID/PERSISTENCE_LIVE_SMOKE_TEST.md`
- `AI_POS_PTKV_CDS_HYBRID/PERSISTENCE_OFFLINE_REPLAY_QA.md`
- `AI_POS_PTKV_CDS_HYBRID/PERSISTENCE_CROSS_SESSION_QA.md`
- `AI_POS_PTKV_CDS_HYBRID/SPRINT_7_2B_BACKEND_DEPLOYMENT_REPORT.md`

Environment/configuration changed before this run:

- `.env.production`: `VITE_PERSISTENCE_API_URL`
- `.env.production`: `VITE_LEGACY_AUTH_API_URL`

No frontend UI, business logic, auth, routing, service behavior, Apps Script schema, or data model was changed.

## Endpoint variable audit

`src/services/persistenceService.ts` uses:

1. `VITE_PERSISTENCE_API_URL`
2. `VITE_APPS_SCRIPT_API_URL`
3. `VITE_LEGACY_AUTH_API_URL`

This is the preferred resolver order requested by Sprint 7.2B.

## Health result summary

PASS.

Observed:

- `ok: true`
- `service: "persistence"`
- `supportsPersistence: true`
- `apiVersion: 1`
- `schemaVersion: 1`
- `sheetsReady: true`
- `build: "7.1A-merged-auth-rc1"`
- actions advertised: 9

No token, Script ID, Sheet ID, password, or deployment key is reproduced here.

## Smoke test result

PASS.

- learner login: PASS
- progress persists after new login token: PASS
- bookmark persists after new login token: PASS
- quiz attempt persists after new login token: PASS
- review persists after new login token: PASS
- learner UI logout/login in Vite preview: PASS
- persisted review visible in Profile/Results: PASS

## Offline replay result

PASS.

The real `offlineSyncQueue` module was tested with a simulated failed flush followed by a restored live backend write. Queue pending count returned to zero and the replayed bookmark existed remotely.

## Cross-session result

PASS.

Verified through a second authenticated learner login token after writes. Remote state was read from persistence actions, not from component state.

## Admin regression result

PASS.

- admin login through normal UI: PASS
- admin dashboard opens: PASS
- Organization Explorer visible: PASS
- direct `admin_list_users`: PASS
- no destructive admin action performed

## Validation

| Check | Result |
|---|---|
| `npm run lint` | PASS |
| `npm run build` | PASS |
| Vite preview HTTP 200 | PASS |

Build produced the existing large chunk warning only; no build failure.

## Required next action

Set the same variables in Netlify production:

```env
VITE_PERSISTENCE_API_URL=<persistence-enabled Apps Script /exec URL>
VITE_LEGACY_AUTH_API_URL=<same merged Apps Script /exec URL>
```

Then trigger a production deploy.

## Final decision

`ENTERPRISE_PERSISTENCE_PASS`

Reason: health, authenticated persistence writes, authenticated re-reads, offline queue replay, admin regression, lint, build, and preview all passed.
