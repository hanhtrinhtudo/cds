# Sprint 4C RLS Plan

This plan is intentionally not implemented in Sprint 4A Alternative.

## Goals

- Enable Row Level Security on application tables after app-managed JWT auth and ownership rules are stable.
- Keep the app-managed `users` table as the source of truth for `role`, `unit_id`, and `account_status`.
- Preserve backend service-role access for trusted server workflows while preventing direct client access beyond explicit policies.

## Proposed Policy Groups

1. `users`
   - Users can read their own profile.
   - Admin and political officer roles can read and update approval/status fields.
   - Members cannot update `role`, `unit_id`, or `account_status`.

2. Learning content
   - Active users can read published/assigned topics.
   - Instructors/admins can create and update learning topics.
   - Assignment visibility is limited to the assigned user or assigned unit.

3. Progress, quiz, and exam attempts
   - Users can read and write their own attempts/progress.
   - Instructors/admins can read reports for allowed units.
   - Server-side grading remains service-role mediated.

4. Notifications and audit logs
   - Users can read their own notifications.
   - Audit logs are admin/political-officer read-only.
   - Insertions are backend-only.

5. AI chat history
   - Users can read/write their own chat history.
   - No cross-user reads except admin audit/reporting workflows if explicitly approved.

## Migration Order

1. Add helper SQL functions for current profile, active status, and role checks.
2. Enable RLS on one low-risk table first, then verify API behavior through backend routes.
3. Add table policies in small batches with regression tests for active, pending, suspended, rejected, and role-specific users.
4. Remove any temporary permissive policies.
5. Document final policy matrix in the deployment runbook.

## Required Tests

- Missing token rejected.
- Invalid token rejected.
- Pending/suspended/rejected users blocked on protected data tables.
- Active member cannot read another user's private progress.
- Instructor/admin permissions only apply to allowed management/reporting routes.

## Gate 6B Implementation Status

Gate 6B has implemented the first RLS policy set in `schema.sql`.

Implemented:

- RLS enabled on all 18 application tables.
- Helper functions added for `auth.uid()` identity, active-user state, role, unit scope, and topic-management scope.
- Public news read policy: guests can read only `published/public` news.
- Active-user news read policy: active users can read `published/public` and `published/internal` news.
- Admin/political officer news management policy.
- Owner-only policies for notifications and AI chat messages.
- Owner/member policies for quiz attempts, official exam attempts, exam answers, and learning progress.
- Instructor/admin scoped policies for learning content, questions, exams, and assignments.
- Admin/political officer read policy for audit logs.
- Conservative restrictions for direct `questions` table access because `correct_answers` cannot be column-redacted by RLS alone.

Important limitation:

- PTKV currently uses app-managed Express JWTs and Supabase service-role repositories. Service-role requests bypass RLS by design. These policies protect direct Supabase client access only when Supabase `auth.uid()` maps to `public.users.id`.
- Learner-facing answer redaction remains a backend DTO responsibility.
- User self-update is conservatively denied at RLS level until field-level privileges or a safe profile-update function exists.

Rollback guidance:

- Local/test rollback may disable RLS table-by-table with `ALTER TABLE <table> DISABLE ROW LEVEL SECURITY;`.
- Local/test rollback may drop the Gate 6B policies/functions by name.
- Production rollback must never happen without backup, tested migration, count report, and explicit approval.
