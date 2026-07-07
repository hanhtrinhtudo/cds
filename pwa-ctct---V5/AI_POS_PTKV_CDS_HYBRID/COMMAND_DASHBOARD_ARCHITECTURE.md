# Command Dashboard Architecture

## Executive summary

Sprint 7.3C introduces the first true Command Center module for the separated admin shell: `Dashboard chỉ huy`.

The module is isolated under `src/components/admin/dashboard/` and is consumed through the existing `AdminCommandDashboard` wrapper. Learner UI, auth, persistence, analytics contracts, learning, exam, news and AI flows are unchanged.

## Module structure

- `CommandDashboard.tsx`: orchestration, filter state, one shared analytics load, drill-down state.
- `CommandKpiGrid.tsx`: eight command KPI cards.
- `RealtimeActivityFeed.tsx`: latest activity timeline.
- `UnitProgressPanel.tsx`: unit progress and completion signals.
- `TopUnitsPanel.tsx`: ranked unit view based on available PEQI/progress/activity signals.
- `TopLearnersPanel.tsx`: ranked learner view based on available learner signals.
- `CommandAlertsPanel.tsx`: neutral risk/support alerts.
- `QuickActionsPanel.tsx`: non-destructive admin navigation shortcuts.
- `DrillDownPanel.tsx`: KPI/unit/learner/event detail panel.
- `dashboardTypes.ts`: local dashboard view types.
- `dashboardUtils.ts`: event labels, KPI derivation, alert derivation and formatting helpers.

## Data flow

`CommandDashboard` uses one load cycle:

1. `analyticsService.health()`
2. If supported:
   - `analyticsService.getAdminSummary()`
   - `analyticsService.adminListEvents()`
3. Derived locally:
   - KPI list
   - learner signals
   - command alerts
   - ranked units/learners

No fake values are created. Missing values render as `--` or no-data states.

## State model

Each remote-backed widget supports:

- Loading
- No Data / Analytics unavailable
- Live Data

Quick Action is intentionally static and non-destructive; it remains available because it is navigation, not analytics data.

## Admin shell integration

`AdminCommandDashboard.tsx` is now a wrapper around `CommandDashboard`.

`AdminCommandShell.tsx` passes `setSection` into the dashboard so quick actions can navigate to:

- Quân số
- Đơn vị
- Hoạt động
- Kết quả
- Học viên
- Báo cáo

The existing `AdminPanel` internals remain available under the command shell and are not deleted.

## Business logic preservation

No learner business logic, auth flow, persistence flow, analytics API contract, service behavior, exam flow, news flow or AI request behavior was changed.
