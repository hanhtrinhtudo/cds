# Admin Approval Flow

1. Quản lý lực lượng → Phê duyệt filters accounts with `pending` status.
2. Duyệt invokes the existing status handler with `active`.
3. Từ chối invokes the existing status handler with `rejected`.
4. Empty queue renders a clear no-data state.

No new endpoint or automatic approval exists. QA must not execute these mutations without a disposable account. Status/role changes from the roster likewise use existing safe handlers.

