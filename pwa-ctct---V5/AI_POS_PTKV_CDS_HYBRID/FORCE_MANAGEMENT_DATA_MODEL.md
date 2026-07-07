# Force Management Data Model

## Account and organization

| UI field | Source |
|---|---|
| Full name | `User.fullName` |
| Username/email | `User.email`, falling back to stable user ID for display only |
| Unit | matching `Unit.name`, `organizationName`, then `unitId` |
| Role | `User.role` mapped to a Vietnamese product label |
| Account status | `User.accountStatus` |
| Created/updated | `User.createdAt`, `User.updatedAt` |
| Organization path | `User.organizationPath` when supplied |

## Learning and analytics

| Profile area | Source |
|---|---|
| Topic progress | existing `LearningProgress[]`, filtered by selected UserID |
| Topic title | existing `LearningTopic[]` |
| Quiz history | `QUIZ_SUBMIT` analytics events |
| Review history | `REVIEW_OPEN`, `REVIEW_COMPLETE` events |
| AI usage | `AI_PROMPT`, `AI_RESPONSE` metadata only; prompt/answer text is never rendered |
| News views | `NEWS_VIEW` events |
| PEQI | `analyticsService.getUserPEQI()` |
| Timeline | `analyticsService.adminListEvents()` for selected UserID, 30 days, limit 100 |
| Summary | `analyticsService.getUserSummary()` |

## Honest gaps

- Roster PEQI and last activity show `--` because bulk per-user analytics is not part of the current contract.
- Per-topic progress appears only when supplied through current admin props; aggregate completion is not expanded into invented topic rows.
- Exam and review histories are event-backed in this sprint. Missing events produce no-data states.
- Role capability matrix documents product intent; it does not claim a new permission backend.

