# Persistence Handshake Report

## Required contract

The prepared patch now returns:

- `ok`
- `service: "persistence"`
- `supportsPersistence: true`
- `apiVersion: 1`
- `schemaVersion: 1`
- `build: "7.1A-rc1"`
- `sheetsReady`
- all supported `actions`
- `time`
- migration capability markers

## Live observation

On 2026-07-07, the production Auth Apps Script URL was called with `action=persistence.health`.

Observed behavior:

- HTTP request completed and returned JSON.
- The response was the generic Auth API response rather than the persistence handshake.
- `supportsPersistence`, versions, build, action list, migration markers, and `sheetsReady` were absent.
- The generic response exposed a spreadsheet identifier field. The value is intentionally omitted here.

Conclusion: the deployed dispatcher does not currently route persistence actions.

## Frontend-safe capability rule

Future frontend integration may enable synchronization only when all are true:

```text
ok === true
service === "persistence"
supportsPersistence === true
apiVersion >= 1
schemaVersion >= 1
sheetsReady === true
```

Anything else must be treated as persistence unavailable. The client must not infer capability from HTTP 200 alone.

