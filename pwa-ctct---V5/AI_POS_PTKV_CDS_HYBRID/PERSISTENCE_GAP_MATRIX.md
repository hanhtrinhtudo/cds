# Persistence Gap Matrix

Legend: **Yes** means supported by the current inspected path; **Conditional** means dependent on deployed Apps Script behavior that is not available in this repository.

| Data item | Current source | Current storage | Survives refresh | Survives logout | Survives new device | Risk | Fix required |
|---|---|---|---|---|---|---|---|
| Learning progress | LearningCenter/App | React state; static legacy seed on reload | No | No | No | Critical | `progress.get`, `progress.upsert` |
| Completed lessons | LearningCenter/App | React state only in legacy mode | No | No | No | Critical | Persist completion and timestamps remotely |
| Practice quiz attempts | PracticeQuiz/App | React state only | No | No | No | Critical | `quizAttempt.save`, `quizAttempt.listMine` |
| Lesson quiz attempts | LearningCenter | localStorage review pack only | Yes | Yes | No | High | Save attempt remotely and link review |
| Official exam result | Official Exam Apps Script | Remote Sheet, conditional on deployed API | Conditional | Conditional | Conditional | Medium | Verify backend schema/action and use stable user ID |
| Mock exam result | Mock Apps Script | Remote Sheet, conditional on deployed API | Conditional | Conditional | Conditional | Medium | Verify `submitResult`/`myResults` retention |
| App exam-attempt list | App/cdsLegacyService | React state plus static seed | No reliable recovery | No | No | High | Add current-user result listing adapter |
| Bookmarks | LearningCenter | Component state | No | No | No | High | `bookmark.list`, `bookmark.toggle` |
| Review history | reviewService | Global browser localStorage | Yes | Yes | No | Critical | Remote review actions; immediately namespace local keys by user in implementation sprint |
| Latest score | App derived selector | Mixed remote/in-memory/local review | Inconsistent | Inconsistent | Inconsistent | High | Derive from synchronized attempts/results |
| Dashboard completion | Dashboard derived selector | In-memory progress/static seed | No | No | No | Critical | Derive from remote progress |
| Weak topics | Results/Dashboard | In-memory progress and attempts | No | No | No | High | Derive from synchronized progress/attempts |
| Selected-bank result summary | Exam Apps Script | Remote API response | Conditional | Conditional | Conditional | Medium | Verify and standardize `results` contract |
| Selected-bank ranking | Exam Apps Script | Remote API response | Conditional | Conditional | Conditional | Medium | Standardize `ranking.get` contract |
| Generic ranking state | reportService/cdsLegacyService | Static seed/fallback | Reloads but not personal truth | Same seed | Same seed | High | Stop treating seed rows as real analytics |
| AI chat history | AITutor | React state | No | No | No | Medium | Optional server log/history with explicit retention policy |
| Review-to-AI context | reviewService | First local review history item | Yes locally | Yes locally | No | High | User-scope reviews and synchronize before AI context |
| Learner activity logs | None found | None | No | No | No | Medium | Optional `activity_logs` and append action |
| Admin auth audit | Auth Apps Script | Remote audit, conditional | Conditional | Conditional | Conditional | Low | Keep existing action; document retention |

## Recovery priority

1. Learning progress/completion.
2. Quiz attempts and review ownership isolation.
3. Bookmarks.
4. Unified current-user results/latest score.
5. Ranking normalization.
6. Optional AI/activity telemetry after consent and retention rules.

