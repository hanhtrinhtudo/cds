# Persistence Offline Replay QA

Date: 2026-07-07

## Scope

Sprint 7.2B required a safe write-path offline replay test for:

- queue creation under `ptkv_offline_sync_queue_v1`
- replay after endpoint restoration
- queue removal after successful remote write
- remote state visible after reload/login

## Result

Status: PASS.

Verified with the real `offlineSyncQueue` module and the live persistence backend:

1. A safe bookmark write was enqueued.
2. First flush simulated an offline/backend failure.
3. Queue state became: `failed: 1`, `pending: 1`.
4. Endpoint write was restored.
5. Second flush succeeded.
6. Queue state became: `pending: 0`.
7. Remote `bookmark.list` confirmed the replayed bookmark exists.

## Decision

Offline replay QA PASS.
