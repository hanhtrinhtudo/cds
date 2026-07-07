# Offline Sync Queue

## Storage

Key: `ptkv_offline_sync_queue_v1`

Each item contains `id`, `userId`, operation type, payload, timestamps, attempts, sanitized last error, idempotency key, and next retry time.

## Supported writes

- `progress.upsert`
- `quizAttempt.save`
- `review.save`
- `bookmark.toggle`

Auth and read actions are never queued.

## Isolation and replay

- Flush filters strictly by the authenticated UserID.
- One user's queue is never replayed with another user's token.
- Quiz/review use AttemptID as idempotency key.
- Progress uses TopicID.
- Bookmark uses ResourceType + ResourceID and explicit desired state.
- Duplicate queue writes replace the pending desired payload rather than append duplicates.

## Retry

- Maximum attempts: 5.
- Exponential backoff: 1, 2, 4, 8, 16 seconds, capped at 60 seconds.
- Flush occurs after supported login hydration.
- Browser `online` triggers another flush.
- `flushQueue(token, userId)` is exported for manual invocation.
- Items are removed only after an `ok: true` service response.

## Limits

The queue retains at most 200 recent entries. Permanent validation/auth errors are not newly queued by App; only retryable/transport failures are queued.

