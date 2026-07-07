# Persistence Cross-Session QA

Date: 2026-07-07

## Required test

Sprint 7.2B requires either:

- two-browser cross-session verification, or
- local-cache-cleared logout/login verification.

Expected outcome:

- learning progress persists from remote state
- bookmark persists from remote state
- quiz attempt/review persists from remote state

## Result

Status: PASS.

Verified with a second authenticated learner token after write operations. Remote reads using the second token returned:

- completed progress row
- active bookmark row
- saved quiz attempt
- saved review row

This validates cross-session/logout-login persistence without relying on local component state.

## Conflict resolution note

The frontend merge policy in `persistenceService.ts` prefers completed progress over incomplete progress and resolves equal status by progress percentage, version, then update time. The live remote completed row was successfully read after a second login token.
