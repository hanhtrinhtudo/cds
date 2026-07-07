# Enterprise Persistence Integration

## Architecture

PTKV now treats Apps Script persistence as an optional authenticated capability rather than assuming that every HTTP 200 response supports user-data synchronization.

Login flow:

1. Existing login/me completes normally.
2. Core learning and exam catalog data loads through existing services.
3. `persistence.health` is checked against the complete capability rule.
4. When supported, current-user progress, quiz attempts, reviews, and bookmarks hydrate into App state.
5. The user's offline queue is flushed; successful replay triggers a fresh remote read.
6. Dashboard/Profile consume hydrated state.
7. If any capability or hydration step fails, existing legacy/local behavior remains available.

## Integrated writes

- Opening/completing a learning topic performs optimistic progress update and `progress.upsert`.
- Practice and lesson quizzes save immutable attempts and post-submit reviews.
- Official/mock reviews are also forwarded without changing exam submission behavior.
- Bookmark changes use explicit desired `active` state.
- Retryable failures enqueue user-scoped operations.

## Review ownership

New local review cache keys are scoped by user. When a user is active, the old global keys are not automatically read or imported. Remote `review.listMine` is authoritative after successful hydration. This prevents ambiguous legacy data from silently attaching to a different account.

## Source-of-truth policy

- Remote state becomes authoritative after successful capability handshake and hydration.
- Optimistic state keeps interaction responsive during writes.
- Confirmed server responses reconcile progress, quiz attempts, and bookmark state.
- Official exam result submission and result APIs remain unchanged.
- AI chat remains session-local because no AI persistence contract exists.

## Capability failure

The app does not crash, white-screen, or show a technical learner message. Persistence is disabled internally and the pre-existing local/legacy mode continues.

