# Apps Script Persistence Foundation

## Architecture

The persistence module is an additive handler installed in the existing Auth Apps Script deployment. It owns four new Sheets and nine actions while leaving existing auth, news, exam, bank, and result handlers untouched.

Request flow:

1. Existing dispatcher determines `action`.
2. Persistence actions route to `handlePersistenceAction_`.
3. Payload is parsed from JSON body/query parameters.
4. `requireAuthUser_` resolves the session token through the existing server-side auth implementation.
5. The authenticated UserID—not a client owner field—is used for every key and filter.
6. Writes acquire `LockService.getDocumentLock()` and perform key-based idempotent upserts.
7. Responses contain sanitized codes only.

## Additive Sheets

- `learning_progress`: unique `UserID + TopicID`.
- `quiz_attempts`: unique `AttemptID`; ownership conflict is rejected.
- `review_history`: unique `UserID + AttemptID`.
- `bookmarks`: unique `UserID + ResourceType + ResourceID`.

`getOrCreateSheet_` and `ensureHeaders_` create missing sheets/columns. Header detection is case-insensitive. Existing columns are not deleted, renamed, or reordered.

## Safety properties

- Server-owned UserID.
- Lock-protected writes.
- Retry-safe IDs/upsert keys.
- Enum and numeric validation.
- Completion does not regress unless `allowCompletionRegression: true` is explicitly supplied by a future authorized workflow.
- Quiz attempts are immutable on retry.
- Review detail requires `submittedAt`.
- Current-user-only list filters.
- Default list limit 50, maximum 200.
- No stack trace, spreadsheet ID, or raw exception returned.

## Repository limitation

The actual Apps Script source is not in this repository. `PERSISTENCE_APPS_SCRIPT_PATCH.gs.md` is paste-ready, but must be integrated with the deployed project's existing token resolver and dispatcher before the actions exist live.

