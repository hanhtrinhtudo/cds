# Political Education Dashboards

## Shared dashboard model

All dashboards share the same component structure:

- Header
- KPI Grid
- Trend Cards
- Ranking
- Recent Activity
- Drill Down
- Empty/Fallback

## 1. Tiến độ học

Displays:

- Total learners
- Learning today
- Completed
- In progress
- Slow learners
- Required topics
- Topic completion cards
- Unit completion cards
- Drill-down placeholder

Current data behavior:

- Learner count comes from the existing user list.
- Required topic count comes from the existing topic list.
- Analytics-only metrics show `--`.
- Fallback: `No analytics available`.

## 2. Kiểm tra

Displays:

- Total submissions
- Average score
- Pass rate
- Top learners
- Weak learners
- Recent exams
- Topic statistics

Current data behavior:

- Recent exam count comes from the existing exam list.
- Analytics-only metrics show `--`.
- Fallback: no-data state.

## 3. Ôn tập

Displays:

- Total review sessions
- Review today
- Most reviewed topics
- Learners without review
- Review frequency

Current data behavior:

- Question-bank count comes from the existing question list.
- Analytics-only metrics show `--`.
- Fallback: no-data state.

## 4. AI Tutor

Displays:

- AI conversations
- Questions today
- Top asked topics
- Top AI users
- Unknown topics

Current data behavior:

- No AI content is logged or displayed.
- Analytics-only metrics show `--`.
- Fallback: `Analytics unavailable`.

## 5. Tin tức

Displays:

- News viewed
- Today's readers
- Most read categories
- Unread news
- Latest news

Current data behavior:

- Analytics-only metrics show `--`.
- Fallback: no-data state.

## No fake data guarantee

The module does not fabricate learning, exam, review, AI or news analytics. Unsupported values are shown as `--` with clear explanatory helper text.
