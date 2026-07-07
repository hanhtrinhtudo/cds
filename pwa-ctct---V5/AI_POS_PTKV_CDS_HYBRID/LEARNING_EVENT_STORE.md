# Learning Event Store

Sprint 7.3 introduces an additive event store for command-level visibility.

## Sheet

`learning_events`

Headers:

`EventID, UserID, Username, FullName, Unit, Role, EventType, ResourceType, ResourceID, ResourceTitle, Category, Score, ProgressPercent, DurationSeconds, Status, MetadataJSON, CreatedAt, ClientTime, SessionID, Device, AppVersion`

## Event ownership

All learner events must use `UserID` resolved from the authenticated token/session. Client-supplied user IDs are not trusted.

## Privacy

AI prompt/response metadata is sanitized. The system stores mode/category/source counts, not full free-text prompt or full AI answer content.

