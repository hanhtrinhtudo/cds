# Persistence API Contract

All requests target the existing Auth Apps Script `/exec` URL. Except for health, include the current session token. POST JSON is recommended. Client-supplied `userId` is ignored.

## `persistence.health`

`GET ?action=persistence.health`

Returns `{ ok, service, version, sheetsReady, time }` and idempotently verifies all four Sheets.

## `progress.get`

Input: `{ token, topicId?, limit? }`.

Returns `{ ok: true, items: LearningProgressRow[] }`, newest updated first.

## `progress.upsert`

Input: `{ token, topicId, status, progressPercent, needReview?, startedAt?, allowCompletionRegression? }`.

Returns `{ ok, created, item }`. Version starts at 1 and increments. Normal clients should never send `allowCompletionRegression`.

## `quizAttempt.save`

Input: `{ token, attemptId, quizType, topicId?, startedAt?, submittedAt?, score, correct, wrong, skip, total, answers, device? }`.

The counts must sum to total. A repeated AttemptID belonging to the same user returns the existing row; another owner receives `ATTEMPT_ID_CONFLICT`.

## `quizAttempt.listMine`

Input: `{ token, limit? }`. Returns newest submitted attempts first.

## `review.save`

Input: `{ token, attemptId, sourceType, title, submittedAt, score, total, correct, wrong, skip, answers }`.

`submittedAt` is required so answer details cannot be stored as a pre-submit review. Upserts on authenticated UserID + AttemptID.

## `review.listMine`

Input: `{ token, sourceType?, limit? }`. Returns newest reviews first and exposes parsed `answers`, not raw `AnswersJSON`.

## `bookmark.list`

Input: `{ token, limit? }`. Returns active bookmarks only.

## `bookmark.toggle`

Input: `{ token, resourceType: "learning_topic", resourceId, active? }`.

If `active` is omitted, the server toggles current state. Supplying the desired boolean is recommended for retry-safe clients.

## Error envelope

`{ ok: false, error: "SANITIZED_CODE" }`

Expected codes include `AUTH_REQUIRED`, `INVALID_SESSION`, `INVALID_*`, `ATTEMPT_ID_CONFLICT`, `REVIEW_REQUIRES_SUBMISSION`, and `PERSISTENCE_ERROR`. HTTP status remains constrained by Apps Script ContentService; clients must inspect `ok`.

