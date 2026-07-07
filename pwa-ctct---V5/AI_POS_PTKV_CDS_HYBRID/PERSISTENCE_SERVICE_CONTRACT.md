# Persistence Service Contract

## Endpoint

`persistenceService` uses the existing `VITE_LEGACY_AUTH_API_URL`. It sends JSON using `text/plain;charset=UTF-8`, matching the current Apps Script CORS-safe request pattern. Tokens are read by App from the existing auth client and passed to service methods; they are never logged.

## Capability gate

Persistence activates only when:

```text
ok === true
service === "persistence"
supportsPersistence === true
apiVersion >= 1
schemaVersion >= 1
sheetsReady === true
```

## Methods

- `health()`
- `getProgress(token, topicId?)`
- `upsertProgress(token, payload)`
- `saveQuizAttempt(token, payload)`
- `listQuizAttempts(token)`
- `saveReview(token, payload)`
- `listReviews(token)`
- `listBookmarks(token)`
- `toggleBookmark(token, payload)`

## Transport behavior

- 12-second timeout using AbortController.
- HTTP status and JSON `ok` are both checked.
- Raw backend messages are not surfaced to learner UI.
- Errors are normalized as `PersistenceError` with a sanitized code and retryable flag.
- Reads and writes are UI-agnostic.

## Normalization

Both camelCase and Sheet-style PascalCase fields are accepted. Remote progress, attempts, reviews, and bookmarks map into existing frontend models without changing auth or exam contracts.

