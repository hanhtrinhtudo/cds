# PTKV Product Components

Sprint 6.3D introduces product-level presentational components built on top of `src/components/ui`.

## Rules

- Product components do not call services.
- Product components do not read localStorage/sessionStorage.
- Product components do not own routing or cross-screen state.
- Product components receive all data and callbacks through props.
- Screen components remain responsible for orchestration and business logic.

## Components

- `ExamCard`: exam/mock/practice bank card.
- `LearningCard`: learning material/topic card.
- `NewsItem`: news card/list item with image fallback.
- `RankingRow`: ranking row for user/unit leaderboard.
- `ReviewAnswerCard`: review answer explanation item.
- `ChatBubble`: AI/user/system message bubble.
- `ChatComposer`: AI prompt chips and input composer.

## Migration note

Sprint 6.3D migrates only safe repeated UI patterns. It does not complete a full screen refactor.
