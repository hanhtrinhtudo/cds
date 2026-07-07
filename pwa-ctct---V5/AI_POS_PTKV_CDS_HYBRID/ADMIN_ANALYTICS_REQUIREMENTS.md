# Admin Analytics Requirements

Organization analytics should use canonical `OrganizationID`, not raw unit text.

## Required analytics

- Member count by organization and descendants
- Active / pending account count
- Learning progress by organization
- Exam results by organization
- Ranking by organization
- News read activity by organization when backend stores it
- AI usage activity by organization when backend stores it

## Honest empty states

If backend does not store a data type, Admin must show an empty state and list the required backend action/sheet instead of fabricating data.

## Current Sprint 7.1 status

Account counts can be shown from existing admin user data. Learning/exam/news/AI analytics require backend storage/actions beyond the organization foundation.
