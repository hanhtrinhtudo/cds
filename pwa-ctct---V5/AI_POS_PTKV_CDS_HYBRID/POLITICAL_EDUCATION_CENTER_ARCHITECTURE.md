# Political Education Center Architecture

## Objective

Create a top-level Admin Command Center module named **Giáo dục chính trị** for education-management views without expanding backend, Apps Script, APIs, PEQI, notifications or learner UI.

## Admin IA

Admin Command Center now contains:

- Dashboard
- Quản lý lực lượng
- Giáo dục chính trị
- Theo dõi chất lượng
- Báo cáo
- Hệ thống

The **Giáo dục chính trị** module contains five internal dashboards:

- Tiến độ học
- Kiểm tra
- Ôn tập
- AI Tutor
- Tin tức

## Component architecture

Shared reusable components live under:

`src/components/admin/education/`

Created components:

- `PoliticalEducationCenter`
- `EducationDashboardLayout`
- `EducationDashboardHeader`
- `EducationKpiGrid`
- `EducationTrendPanel`
- `EducationRankingPanel`
- `EducationRecentActivity`
- `EducationEmptyState`

Supporting files:

- `educationTypes.ts`
- `educationUtils.tsx`
- `index.ts`

## Layout contract

Every dashboard follows the same sequence:

1. Header
2. KPI Grid
3. Trend Cards
4. Ranking
5. Recent Activity
6. Drill Down
7. Empty/Fallback state

This keeps the five dashboards consistent and avoids duplicated JSX.

## Data policy

This sprint is UI and IA only.

- No backend expansion.
- No Apps Script changes.
- No analytics calculations.
- No PEQI changes.
- No AI logic.
- No notifications.
- No fake analytics.

When analytics is unavailable, analytics-backed metrics display `--` and the dashboard shows clear fallback states such as `No analytics available`.

## Integration point

`AdminCommandShell` renders `PoliticalEducationCenter` when the selected admin section is `education`.

Learner shell is unchanged.
