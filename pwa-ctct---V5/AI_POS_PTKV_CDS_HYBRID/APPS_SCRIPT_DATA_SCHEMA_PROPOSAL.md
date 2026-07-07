# Apps Script Data Schema Proposal

The proposal is additive. It must not delete or rename existing authentication, exam, bank, result, or audit sheets. Header matching should be case-insensitive and migration scripts idempotent.

## `learning_progress`

| Column | Purpose |
|---|---|
| ProgressID | Stable row identifier |
| UserID | Auth user ID |
| TopicID | Stable learning topic/file ID |
| Status | NOT_STARTED, IN_PROGRESS, COMPLETED, NEED_REVIEW |
| ProgressPercent | 0–100 |
| NeedReview | Boolean |
| StartedAt | ISO timestamp |
| CompletedAt | ISO timestamp, optional |
| LastAccessedAt | ISO timestamp |
| UpdatedAt | ISO timestamp |
| Version | Integer for conflict handling |

Unique key: `UserID + TopicID`. `progress.upsert` must update the existing row rather than append duplicates.

## `quiz_attempts`

| Column | Purpose |
|---|---|
| AttemptID | Client idempotency key/server ID |
| UserID | Auth user ID |
| QuizType | practice, learningQuiz |
| TopicID | Optional topic/file ID |
| StartedAt | ISO timestamp |
| SubmittedAt | ISO timestamp |
| Score | 0–10 |
| Correct | Count |
| Wrong | Count |
| Skip | Count |
| Total | Count |
| AnswersJSON | Submitted answers only |
| Status | submitted |
| Device | Optional coarse device label |
| CreatedAt | ISO timestamp |

Unique key: `AttemptID`. Never return correct answers before submission.

## `review_history`

| Column | Purpose |
|---|---|
| ReviewID | Stable ID |
| AttemptID | Related quiz/exam attempt |
| UserID | Owner |
| SourceType | practice, learningQuiz, mock, official |
| Title | Display title |
| SubmittedAt | ISO timestamp |
| Score | 0–10 |
| Total | Count |
| Correct | Count |
| Wrong | Count |
| Skip | Count |
| AnswersJSON | Post-submit review detail |
| CreatedAt | ISO timestamp |
| UpdatedAt | ISO timestamp |

Unique key: `UserID + AttemptID`. Read actions must enforce owner/admin scope.

## `bookmarks`

| Column | Purpose |
|---|---|
| BookmarkID | Stable ID |
| UserID | Owner |
| ResourceType | learning_topic initially |
| ResourceID | Topic/file ID |
| Active | Boolean tombstone for toggle sync |
| CreatedAt | ISO timestamp |
| UpdatedAt | ISO timestamp |

Unique key: `UserID + ResourceType + ResourceID`.

## `ai_chat_logs` (optional)

| Column | Purpose |
|---|---|
| ConversationID | Conversation identifier |
| MessageID | Idempotency key |
| UserID | Owner |
| Role | user/model/system |
| Mode | FAST/DEEP/DRILL/EXPLAIN/POLICY/STUDY_PLAN |
| MaterialID | Optional learning file ID |
| Content | Message text or redacted summary per policy |
| SourcesJSON | Returned source metadata |
| CreatedAt | ISO timestamp |
| RetentionUntil | Required retention boundary |

This sheet should not be enabled until privacy, access, deletion, and retention policies are approved. Do not store hidden prompts or secrets.

## `activity_logs` (optional)

| Column | Purpose |
|---|---|
| ActivityID | Idempotency key |
| Time | ISO timestamp |
| UserID | Actor |
| Action | Controlled event name |
| ResourceType | topic, quiz, exam, news, AI |
| ResourceID | Optional stable ID |
| DetailJSON | Minimal non-sensitive metadata |
| OrganizationID | Optional canonical organization |

Use an allowlist of actions and avoid logging raw answer or AI content unless explicitly required.

## Required actions

### `progress.get`

Input: authenticated user, optional `topicId`. Returns only the user's progress unless admin/officer scope is explicitly authorized.

### `progress.upsert`

Input: `topicId`, `status`, `progressPercent`, `needReview`, timestamps, optional `version`. Idempotent on `UserID + TopicID`; server owns UserID from token.

### `quizAttempt.save`

Input: attempt payload. Idempotent on `AttemptID`; validates counts and submission state.

### `quizAttempt.listMine`

Input: optional topic/type/cursor. Returns current authenticated user's attempts.

### `review.save`

Input: post-submit review pack. Server verifies owner and associated attempt where possible.

### `review.listMine`

Input: optional source type/cursor. Returns owner-scoped reviews, newest first.

### `bookmark.list`

Returns active bookmarks for the authenticated user.

### `bookmark.toggle`

Input: `resourceType`, `resourceId`, optional desired `active`. Upserts rather than blindly appending.

### `ranking.get`

Input: bank, scope, organization/unit, limit. Returns normalized rows and source metadata; rankings must be computed from persisted submitted attempts only.

## Security and consistency rules

- Resolve UserID from the session token, never trust a client-supplied owner ID.
- Use `LockService` around upserts.
- Validate enum values, numeric ranges, and JSON size.
- Return sanitized errors without Sheet IDs or stack traces.
- Add indexes through in-memory maps during each request; avoid per-row Sheet calls.
- Paginate history actions.
- Use server timestamps and idempotency keys.

