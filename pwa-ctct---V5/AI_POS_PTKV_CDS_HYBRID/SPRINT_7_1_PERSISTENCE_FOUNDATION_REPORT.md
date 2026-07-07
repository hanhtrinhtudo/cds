# Sprint 7.1 Persistence Foundation Report

## Executive summary

An additive, paste-ready Apps Script persistence module was produced for learning progress, quiz attempts, review history, and bookmarks. It includes exact schemas, case-insensitive header repair, server-derived ownership, LockService upserts, idempotency, validation, current-user filtering, and sanitized errors.

The deployed Apps Script project is not present in this repository. Therefore the patch could not be wired to the real token resolver/dispatcher, deployed, or manually tested at the live `/exec` URL.

## Files created

- `PERSISTENCE_APPS_SCRIPT_PATCH.gs.md`
- `APPS_SCRIPT_PERSISTENCE_FOUNDATION.md`
- `PERSISTENCE_API_CONTRACT.md`
- `PERSISTENCE_MANUAL_TESTS.md`
- `SPRINT_7_1_PERSISTENCE_FOUNDATION_REPORT.md`

## Contracts preserved

- No frontend source or UI changed.
- No existing auth, register, news, exam, bank, result, routing, or storage contract changed.
- No existing Sheet is deleted or renamed.
- No frontend integration was added.

## Implemented foundation

- Nine requested actions, including unauthenticated health and eight authenticated data actions.
- Four idempotently created Sheets with exact headers.
- Required helper functions.
- Required enum/range validation.
- Lock-protected key-based writes.
- Non-regressing completion and incrementing Version.
- Immutable idempotent quiz attempt retry.
- Post-submit review guard.
- Desired-state bookmark toggle.
- Default limit 50 and newest-first histories.

## Validation

- Static patch review: completed.
- Existing application source changes: none.
- npm lint/build: not run because no application code or build input changed.
- Live Apps Script action tests: blocked until deployment and auth adapter integration.

## Required external completion

1. Paste the patch into the deployed Auth Apps Script project.
2. Bind `requireAuthUser_` to its existing token-session lookup helper.
3. Add the dispatcher branch.
4. Deploy a new version.
5. Execute `PERSISTENCE_MANUAL_TESTS.md` with disposable authenticated accounts.

## Final decision

**PERSISTENCE_FOUNDATION_PARTIAL**

