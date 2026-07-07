# Force Management Architecture

## Information architecture

Admin Command Center now exposes six top-level destinations:

1. Dashboard
2. Quản lý lực lượng
3. Giáo dục chính trị
4. Theo dõi chất lượng
5. Báo cáo
6. Hệ thống

The former Quân số and Học viên destinations are merged into Quản lý lực lượng. Existing AdminPanel functionality remains available beneath the other command sections.

## Module structure

`ForceManagement` owns five internal tabs: Tổng quan, Quân số, Hồ sơ, Phê duyệt, Phân quyền. It receives account data and existing safe callbacks from `AdminCommandShell`; product components do not call account mutation services directly.

`ElectronicLearningProfile` is the analytics orchestration boundary. On selected user change it checks analytics health, then loads user summary, PEQI and 30-day events concurrently. A cancellation flag prevents stale responses from replacing the newly selected learner.

## State model

- Account information: always rendered from existing admin props.
- Analytics loading: skeleton or pending indicator.
- Analytics unavailable: honest informational state and `--` metrics.
- Analytics live: events and PEQI rendered from returned records only.
- Empty collection: explicit no-data state.

## Mutation safety

Approval, status and role controls call existing `onUpdateUserStatus` and `onChangeUserRole` handlers. There is no new service action and no automatic destructive operation.

## Responsive behavior

- Top-level admin navigation and force tabs scroll horizontally on mobile.
- Roster uses cards rather than a dense table.
- Profile sections stack on mobile and become two columns on large screens.
- Inputs and actions use minimum 44px targets.
- Text and identifiers wrap rather than causing horizontal page overflow.

