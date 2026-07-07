# UI Freeze RC1

## Freeze decision

Final decision: UI_FREEZE_RC1_PASS_WITH_MINOR_FIXES

Learner runtime QA and admin runtime QA were completed with normal login through the application UI. Two minor visual-only touch-target issues were found and fixed:

- Learning detail action buttons were below the 44px touch target guideline.
- Admin panel tab/status controls were below the 44px touch target guideline.

No service, API, Apps Script, auth, routing, storage, AI payload, exam logic, or data model changes were made.

## Freeze scope

Frozen for RC1:

- Authentication UI
- Dashboard
- Learning list
- Learning detail
- News list
- News detail component scope
- Exam/mock exam list
- Results/profile/ranking
- AI Workspace
- Admin static-mode panel
- Bottom navigation
- App shell
- Core UI primitives and product components used by these screens

## Screens frozen

| Screen | RC1 status |
|---|---|
| Authentication | Frozen |
| Dashboard | Frozen |
| Học tập | Frozen |
| Học tập chi tiết | Frozen with minor touch-target fix |
| Kiểm tra / Thi thử | Frozen |
| Tin tức | Frozen |
| Tin tức chi tiết | Frozen component scope |
| Hỏi AI | Frozen |
| Cá nhân / Kết quả | Frozen |
| Bảng xếp hạng | Frozen |
| Xem lại đáp án | Frozen when local review data exists |
| Admin dashboard/panel | Frozen with minor touch-target fix |

## Components frozen

- App shell
- Bottom navigation
- AppPage/AppWorkspace/AppScrollable/AppBottomBar
- Button/IconButton/Input/Select/Badge/Chip/Card/Surface
- LearningCard
- ExamCard
- NewsItem
- RankingRow
- ReviewAnswerCard
- ChatBubble
- ChatComposer

## Design tokens frozen

- Color tokens
- Typography tokens
- Spacing/radius/elevation tokens
- Motion tokens
- Layout/safe-area tokens
- Product language dictionary for current release scope

## Known exceptions

- Admin content/exam/question-bank authoring remains locked in Netlify static / legacy Apps Script mode unless backend actions are added.
- Review history is local-device based unless backend historical detail APIs are added.
- Existing Vite chunk-size warning remains non-blocking.
- Some historical source strings remain mojibake in code, but tested UI text renders acceptably in current browser runtime.

## Allowed post-freeze changes

- Critical visual-only fixes for clipping, overflow, touch target, safe-area, z-index, or modal fit.
- Documentation updates.
- Environment value updates for deployment.
- Backend data updates outside the frontend bundle.

## Forbidden post-freeze changes

- Service/API contract changes.
- Apps Script endpoint changes from frontend.
- Authentication flow changes.
- Routing model changes.
- Storage/session semantics changes.
- Exam/quiz submit logic changes.
- AI prompt payload/runtime changes.
- Data model changes.
- Broad redesign or component refactor.

## QA evidence

- Learner normal login: PASS
- Admin normal login: PASS
- Learner 390×844: PASS
- Learner 430×932: PASS
- Admin 390×844: PASS after minor visual fix
- Admin 430×932: PASS after minor visual fix
- `npm run lint`: PASS
- `npm run build`: PASS
- Vite preview HTTP 200: PASS

## Final decision

UI_FREEZE_RC1_PASS_WITH_MINOR_FIXES

