# Command Dashboard Data Contract

## Endpoint usage

The dashboard uses the existing `analyticsService` contract only.

Required calls:

- `health()`
- `getAdminSummary(filters)`
- `adminListEvents(filters)`

Optional/future calls remain compatible:

- `getUnitSummary(unit)`
- `getUserSummary(userId)`
- `getUserPEQI(userId)`
- `getUnitPEQI(unit)`

## Filters

Dashboard filter state:

- `range`: `today | 7d | 30d`
- `unit`: `all | selected unit`
- `eventType`: optional
- `search`: optional

Default:

- `range = today`
- `unit = all`

## Admin summary fields consumed

- `totalUsers`
- `activeToday`
- `loggedInToday`
- `learningToday`
- `completedTopics`
- `quizSubmissions`
- `averageScore`
- `weakLearners`
- `units`
- optional `peqiAverage`

If a field is absent, the UI displays `--` or a no-data state.

## Event fields consumed

- `eventId`
- `eventType`
- `userId`
- `username`
- `fullName`
- `unit`
- `resourceTitle`
- `score`
- `progressPercent`
- `createdAt`

The UI never displays raw `MetadataJSON` or unsanitized AI prompt/response content.

## Event labels

- `LOGIN` → `Đăng nhập`
- `OPEN_TOPIC` → `Mở chuyên đề`
- `READ_PROGRESS` → `Cập nhật tiến độ`
- `MARK_COMPLETE` → `Hoàn thành bài học`
- `QUIZ_START` → `Bắt đầu ôn tập`
- `QUIZ_SUBMIT` → `Nộp bài`
- `REVIEW_OPEN` → `Xem lại đáp án`
- `NEWS_VIEW` → `Xem tin`
- `AI_PROMPT` → `Hỏi AI`
- `LOGOUT` → `Đăng xuất`

## Widget state behavior

All remote-backed widgets support:

| Widget | Loading | No Data | Live Data |
|---|---|---|---|
| KPI | Skeleton | Kho phân tích chưa sẵn sàng | KPI cards |
| Hoạt động realtime | Skeleton list | No recent events / unavailable | Timeline |
| Tiến độ đơn vị | Skeleton list | No unit progress | Unit rows |
| Top đơn vị | Skeleton list | No ranking signals | Ranked units |
| Top học viên | Skeleton list | No learner signals | Ranked learners |
| Cảnh báo | Skeleton list | Not enough data | Alerts |
| Drill Down | Not applicable | Empty related activity | Detail panel |

## Anti-fake-data rule

The dashboard does not fabricate:

- PEQI
- ranking
- average score
- weak learner count
- unit completion
- activity rows

When analytics is unavailable or transiently fails, it shows honest fallback states.
