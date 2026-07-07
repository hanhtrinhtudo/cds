# User Data Persistence Audit

## Executive finding

PTKV is not persistence-ready in `legacy_apps_script` mode. Authentication and official/mock exam submission use Apps Script, but most learner activity is either React state, static seed data, or browser-local storage. Refreshing, signing in again, changing browser, or changing device therefore produces different recovery outcomes.

No Google Apps Script `.gs` source is present in this repository. Backend conclusions below are based on frontend requests and adapters; deployed Sheet names and implementation cannot be verified from source.

## Action trace

### Learning progress and completed lessons

- Created when `LearningCenter.openTopicDetail()` calls `onUpdateProgress(...IN_PROGRESS, 10)` and when completion calls `onUpdateProgress(...COMPLETED, 100)`.
- `App.handleUpdateTopicProgress()` only updates React `progress` state in legacy mode.
- `learningService.startProgress()` and `updateProgress()` return synthetic objects in legacy mode and do not call Apps Script.
- On bootstrap, `App.loadAllData()` replaces progress with `cdsLegacyService.getProgress()` seed rows mapped to the current user.
- Result: changes do not survive refresh. Dashboard completion and profile learning metrics are consequently not authoritative.

### Practice quiz attempts

- Created in `PracticeQuiz.handleNext()` after the final question.
- Passed to `App.handleSaveQuizAttempt()`.
- In legacy mode, it is inserted into React `quizAttempts` only.
- `quizService.getQuizHistory()` returns `cdsLegacyService.getQuizHistory()`, which is static legacy seed data.
- Result: attempt history and weak-topic calculations do not survive refresh or another device.

### Lesson quiz attempts

- `LearningCenter` calculates the result and creates a `learningQuiz` review pack.
- It saves only through `reviewService` to localStorage; no `QuizAttempt` is sent to Apps Script.
- Result: local-device review survives refresh/logout but is not server-backed and is unavailable on another device.

### Official and mock exam attempts

- `OfficialExam.handleSubmitExam()` posts through `examService.submitExamResult()`.
- Official uses the official Apps Script `submit` action; mock uses the dedicated mock service `submitResult` adapter.
- After success, the screen also creates an `ExamAttempt` in React and a review pack in localStorage.
- `examService.getResultSummary()` and leaderboard methods query remote endpoints. However, generic `getExamHistory()` in legacy mode still returns static `cdsLegacyService` data rather than the current user's remote result list.
- Result: remote result/leaderboard can survive devices if the deployed Apps Script stores it, while the local review explanation does not. The App-level attempt list can reset or show seed rows.

### Bookmarks

- Created by `LearningCenter.toggleBookmark()`.
- Stored only in component state `bookmarkedIds`.
- Result: lost when the component unmounts, on refresh, and on logout.

### Review history

- Practice, learning quiz, official, and mock flows call `reviewService.saveReviewPack()`.
- Stored under global keys `ptkv_review_*` and `ptkv_review_history` in localStorage, capped at 30 history entries.
- Keys are not namespaced by user ID.
- Result: survives refresh and normal logout on the same browser, but not a new device. A second account using the same browser can see the first account's review history, which is a privacy and data-integrity risk.

### AI conversation history

- `AITutor` owns `messages` in React state.
- The last six messages are included only in the next request context.
- Clear history resets component state. There is no storage read/write and no frontend call for durable AI logs.
- Result: conversation disappears when the component remounts, refreshes, or the user signs out.

### Dashboard completion and latest score

- Completion rate is derived from the in-memory `progress` array; in legacy mode that array is rebuilt from static seed progress.
- Latest score prefers App `examAttempts`, then browser-local official/mock review packs, then in-memory quiz attempts/browser-local practice reviews.
- Result: completion is not a real user metric. Latest score may survive locally but can be stale, belong to another account on the same device, or differ from remote Sheets.

### Rankings and result summaries

- `ResultsAndRanking` queries `examService.getResultSummary()` and `getLeaderboard()` for the selected official/mock bank.
- `reportService.getRankings()` uses `cdsLegacyService.getLeaderboard()` in legacy mode, which is static fallback data.
- The remote selected-bank view is the authoritative path when supported; global App ranking state is not reliably user-generated.

### Activity logs

- The app reads admin audit logs through the Auth Apps Script admin action.
- Learner learning, bookmark, review, AI, and navigation events are not written by the inspected frontend.
- Result: there is no durable learner activity timeline for analytics.

## Additional integrity risks

1. Browser review keys are global rather than user-scoped.
2. Synthetic seed history can look like real user data unless source state is carefully communicated.
3. Official result identity queries use name/unit in places; stable `userId` should be preferred where the backend supports it.
4. Client-generated IDs (`qa_<timestamp>`, `learning_quiz_<timestamp>`) need server idempotency keys before retry-safe synchronization.
5. There is no offline outbox, conflict policy, or `updatedAt` version for local-to-remote recovery.

## Audited files

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

