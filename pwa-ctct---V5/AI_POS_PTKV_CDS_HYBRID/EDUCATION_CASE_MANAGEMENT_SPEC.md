# Education Case Management Specification

## Frontend model

Cases include identity, learner/unit, reasons, flags, severity, assignee role, recommended actions, status, evidence references and timeline. Statuses are monitoring, improved and closed. Severity is info, warning or danger.

## Current behavior

- Create from any commander action or “Tạo vụ việc”.
- Add an internal action note.
- Transition monitoring → improved → closed (or another selected local state).
- Display recommendation badges and timeline.

## Persistence truth

All cases are **Bản nháp xử lý** in memory. Nothing is stored remotely or in browser storage. No real notification, assignment or learning task is sent. Refresh/remount discards drafts.

## Future safeguards

Remote implementation requires authenticated command scope, audit history, idempotency, optimistic concurrency, assignee validation and non-destructive close semantics.

