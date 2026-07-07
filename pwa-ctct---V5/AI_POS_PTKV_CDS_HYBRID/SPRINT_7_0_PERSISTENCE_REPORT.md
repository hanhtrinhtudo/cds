# Sprint 7.0 Persistence Report

## Executive summary

The audit confirms material persistence gaps. In legacy Apps Script mode, learning progress, completion, practice attempts, bookmarks, and AI chat are not remotely durable. Review packs are device-local and not user-scoped. Official/mock submission and selected-bank result/leaderboard calls are the only inspected learner-data paths with genuine remote persistence potential.

## Files inspected

- `src/App.tsx`
- `src/components/LearningCenter.tsx`
- `src/components/PracticeQuiz.tsx`
- `src/components/OfficialExam.tsx`
- `src/components/ResultsAndRanking.tsx`
- `src/components/AITutor.tsx`
- `src/services/reviewService.ts`
- `src/services/cdsLegacyService.ts`
- `src/services/learningService.ts`
- `src/services/quizService.ts`
- `src/services/examService.ts`
- `src/services/reportService.ts`

No Apps Script `.gs` source was found in the repository, so deployed Sheets and server retention behavior could not be source-verified.

## Documents created

- `USER_DATA_PERSISTENCE_AUDIT.md`
- `PERSISTENCE_GAP_MATRIX.md`
- `APPS_SCRIPT_DATA_SCHEMA_PROPOSAL.md`
- `USER_DATA_RECOVERY_PLAN.md`
- `SPRINT_7_0_PERSISTENCE_REPORT.md`

## Highest risks

1. Learning progress/completion resets because legacy updates remain in React state.
2. Practice attempts reset because they are not sent to Apps Script.
3. Review localStorage is shared across accounts on the same browser.
4. Bookmarks disappear as soon as component state is lost.
5. Dashboard completion/latest score combine static, transient, local, and remote sources.
6. Static fallback ranking/history can be mistaken for current-user truth.

## Implementation decision

No broad fixes were applied. A safe fix requires additive Apps Script Sheets and authenticated APIs first, followed by optimistic frontend synchronization and guarded legacy-local recovery. Implementing browser-only persistence would not satisfy cross-device recovery and would preserve account-isolation defects.

## Validation

- Audit: completed against all requested frontend files.
- Apps Script source validation: blocked because no `.gs` files are present.
- Source code changes: none.
- UI/layout/business logic changes: none.
- Lint/build: not required for documentation-only changes; application source was untouched.

## Final decision

**PERSISTENCE_GAPS_FOUND**

