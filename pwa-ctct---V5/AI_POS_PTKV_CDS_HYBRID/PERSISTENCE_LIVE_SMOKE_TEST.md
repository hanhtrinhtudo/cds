# Persistence Live Smoke Test

Date: 2026-07-07

## Health check

Result: PASS.

The configured local production endpoint was queried for `persistence.health` using the frontend production env. It returned the required persistence capability envelope.

Required health contract:

| Field | Required value |
|---|---|
| `ok` | `true` |
| `service` | `persistence` |
| `supportsPersistence` | `true` |
| `apiVersion` | `>= 1` |
| `schemaVersion` | `>= 1` |
| `sheetsReady` | `true` |
| `actions` | includes all persistence actions |

## Live learner smoke sequence

Result: PASS.

Verified with a normal learner login token. No token or password is recorded.

| Test | Result |
|---|---|
| learner login | PASS |
| progress `IN_PROGRESS` then `COMPLETED 100` write | PASS |
| logout/login equivalent with second authenticated token | PASS |
| progress read after new login | PASS |
| bookmark write | PASS |
| bookmark read after new login | PASS |
| quiz attempt save | PASS |
| quiz attempt list after new login | PASS |
| review save | PASS |
| review list after new login | PASS |

The app runtime was also opened in Vite preview. Learner logout and login through the UI passed; the Profile/Results area displayed the persisted QA review after re-login.

Pending tests:

1. Normal learner login.
2. `persistenceAvailable` capability detection.
3. Learning progress write and rehydrate after logout/login.
4. Bookmark write and rehydrate after logout/login.
5. Safe practice or learning quiz attempt and review persistence.

## Admin regression

Result: PASS.

Verified:

- admin login through normal UI
- admin dashboard opens
- Organization Explorer visible
- management metrics visible
- direct `admin_list_users` action returns data

No destructive admin action was performed.

## Result

Live persistence smoke test PASS.
