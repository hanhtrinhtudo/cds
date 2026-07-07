# Case Backend Contract

## Proposed additive sheet: `education_cases`

Headers:

`CaseID, LearnerID, LearnerName, Unit, Title, ReasonsJSON, RiskFlagsJSON, Severity, AssigneeRole, AssigneeName, RecommendedActionsJSON, Status, EvidenceRefsJSON, TimelineJSON, CreatedAt, UpdatedAt, DueAt, CreatedBy, ClosedAt`

Unique key: `CaseID`. Server derives `CreatedBy` from authenticated token and verifies command scope over LearnerID.

## Proposed actions

- `case.create`
- `case.list`
- `case.get`
- `case.updateStatus`
- `case.addAction`
- `case.assign`
- `case.close`

All writes should use LockService, idempotency keys, append-only audit entries and sanitized errors. Status updates should require expected `UpdatedAt`/version. `case.close` is non-destructive and sets ClosedAt.

This contract is documentation only; no Apps Script modification was made.

