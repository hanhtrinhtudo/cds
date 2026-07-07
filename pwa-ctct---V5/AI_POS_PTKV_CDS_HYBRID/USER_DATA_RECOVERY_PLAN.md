# User Data Recovery Plan

## Goal

Move PTKV from mixed transient/local state to user-scoped Apps Script persistence without breaking the frozen learner UI or existing exam/auth contracts.

## Phase 0 — Protect existing local evidence

1. Do not clear current `ptkv_review_*` keys during deployment.
2. Before importing local reviews, require a normal authenticated session.
3. Detect whether a legacy local review can be confidently attributed to the current user. Current packs lack UserID, so automatic bulk upload is unsafe.
4. Offer an explicit one-time recovery flow in a later sprint; otherwise retain legacy local packs as device-only records.

## Phase 1 — Backend additive schema

1. Create the proposed Sheets and exact headers.
2. Add token-scoped actions without changing existing login/register/exam actions.
3. Implement idempotent upserts with `LockService`.
4. Add a deployment version/health capability so the frontend can detect persistence support.
5. Test with a disposable learner account and duplicate retries.

## Phase 2 — Progress and quiz synchronization

1. On authenticated startup, call `progress.get` and `quizAttempt.listMine` in the background.
2. Replace static `cdsLegacyService.getProgress()` and quiz seed history as user metrics.
3. On learning changes, optimistically update React state, then call `progress.upsert`; visibly retain the last confirmed state on failure.
4. Save practice and lesson quiz attempts with a stable client AttemptID.
5. Recompute Dashboard/Profile metrics only from synchronized current-user rows.

## Phase 3 — Review and bookmarks

1. Add user-scoped remote review storage.
2. Change local cache keys to include UserID, while reading old global keys only through a guarded legacy recovery path.
3. Load remote reviews then merge by AttemptID; remote wins on newer `UpdatedAt`.
4. Add bookmark list/toggle with optimistic UI and retry.

## Phase 4 — Results and rankings

1. Standardize current-user official/mock result listing around stable UserID while retaining name/unit compatibility.
2. Make App latest score derive from remote submitted attempts; use user-scoped local cache only during temporary network failure.
3. Route all ranking views through `ranking.get`, preserving official/mock endpoint separation if the legacy backends remain distinct.
4. Label unavailable data honestly; never substitute seed ranking as real data.

## Phase 5 — Optional telemetry

1. Approve privacy/retention requirements first.
2. Add minimal activity events.
3. Add AI chat persistence only if product policy requires it; otherwise keep conversations ephemeral by design and document that behavior.

## Failure and conflict policy

- UI remains usable with optimistic state, but unconfirmed writes carry a pending marker internally.
- Retry with the same idempotency key.
- For progress, higher Version/newer server `UpdatedAt` wins; completion must not regress without an explicit action.
- For attempts/reviews, immutable submission records are append-once/idempotent.
- For bookmarks, last server-accepted desired state wins.

## Acceptance tests

1. Complete a lesson, refresh, log out/in, and open on a second device: completion remains.
2. Submit practice and learning quizzes: attempts and reviews reopen on another device.
3. Toggle a bookmark repeatedly and retry the same request: one logical row remains.
4. Two accounts sharing a browser cannot see each other's reviews.
5. Latest score matches the newest persisted real attempt.
6. Ranking contains only persisted submissions and no static seed rows.
7. Network failure does not fabricate success and retry does not duplicate records.

## Explicitly deferred from Sprint 7.0

No broad implementation is made in this audit sprint. The changes require coordinated Apps Script schema/actions and frontend synchronization; a local-only patch would deepen the split-brain problem rather than recover user data.

