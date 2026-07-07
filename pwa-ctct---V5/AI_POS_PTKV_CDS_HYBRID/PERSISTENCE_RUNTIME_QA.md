# Persistence Runtime QA

Date: 2026-07-07

## Environment

- Preview: HTTP 200 at `127.0.0.1:4173`.
- Production build loaded without white screen.
- Normal learner login: PASS.
- Normal admin login: PASS.
- Admin Command Area opened: PASS.
- Passwords and tokens are intentionally omitted.

## Capability observation

Sprint 7.2B update: the frontend persistence resolver checks `VITE_PERSISTENCE_API_URL` first, then `VITE_APPS_SCRIPT_API_URL`, then `VITE_LEGACY_AUTH_API_URL`. The local production env now points `VITE_PERSISTENCE_API_URL` and `VITE_LEGACY_AUTH_API_URL` to the merged persistence-enabled deployment. Runtime QA passed for health, learner logout/login, remote progress/bookmark/quiz/review reads, offline queue replay, and admin regression.

## Persistence scenarios

| Scenario | Result | Reason |
|---|---|---|
| Capability detected | FAIL for configured deployment | Missing service/support/version/sheets fields |
| Legacy fallback opens | PASS | Learner and admin sessions opened normally |
| Progress survives relogin remotely | BLOCKED | Capability gate correctly disabled remote writes |
| Bookmark survives relogin remotely | BLOCKED | Capability gate correctly disabled remote writes |
| Practice attempt/review survives relogin | BLOCKED | Capability gate correctly disabled remote writes |
| User-scoped local review cache | Static PASS | Active-user keys no longer fall back to ambiguous global history |
| Offline enqueue/replay against live backend | BLOCKED | No supported backend session to create/replay safe persistence writes |
| Admin auth regression | PASS | Admin login and Command Area available |

## Safety conclusion

No persistence mutation was attempted against a deployment that failed the advertised capability contract. This prevents false success and accidental writes to an unknown/default handler.
