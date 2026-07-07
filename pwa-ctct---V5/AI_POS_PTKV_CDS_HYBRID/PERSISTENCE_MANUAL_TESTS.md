# Persistence Manual Tests

Use a disposable learner account and its token obtained through the normal login action. Do not place credentials or tokens in committed reports. Replace `$URL` and `$TOKEN` locally.

## Installation and health

1. Add the patch to the existing Apps Script project.
2. Connect `requireAuthUser_` to the deployed token resolver.
3. Add dispatcher routing and deploy a new version.
4. Call `GET $URL?action=persistence.health` twice.
5. Confirm `sheetsReady: true`, exact headers, and no duplicate sheets/headers.

## Progress

POST `progress.upsert` with token, `topicId: "qa_topic_1"`, `status: "IN_PROGRESS"`, `progressPercent: 25`.

- Repeat it: one row remains and Version increments.
- Complete at 100, then send IN_PROGRESS 20 without the explicit regression flag: status remains COMPLETED.
- Call `progress.get`: only the authenticated user's row is returned.
- Send 101 percent and an invalid status: sanitized validation errors are returned.

## Quiz attempt

POST `quizAttempt.save` with a unique disposable AttemptID, `practice`, score 8, correct 8, wrong 2, skip 0, total 10, and submitted answers.

- Repeat exactly: `created: false`; one row remains.
- Reuse the ID from another account: conflict, no data disclosure.
- Send counts that do not total correctly: rejected.
- Call `quizAttempt.listMine`: only current-user rows, newest first, default maximum 50.

## Review

POST `review.save` for the submitted disposable attempt.

- Omit `submittedAt`: rejected.
- Repeat with updated title/answers: one user+attempt row remains.
- Call `review.listMine`; verify parsed answers and no other user's rows.

## Bookmark

POST `bookmark.toggle` with `resourceType: "learning_topic"`, disposable resource ID, and `active: true`.

- Repeat desired true: one active row remains.
- Set false: `bookmark.list` no longer returns it.
- Set true and verify it reappears.
- Invalid resource type is rejected.

## Security checks

- Omit token: `AUTH_REQUIRED`.
- Include another user's `userId` in payload: row owner remains token user.
- Use invalid token: `INVALID_SESSION`.
- Trigger an unexpected server error: response contains only `PERSISTENCE_ERROR`, not stack trace or Sheet ID.

## Current execution status

These live tests are pending because the Apps Script source/deployment is external to this repository and the new actions are not deployed from this workspace.

