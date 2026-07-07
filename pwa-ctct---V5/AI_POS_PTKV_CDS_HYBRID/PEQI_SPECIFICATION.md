# Political Education Quality Index (PEQI)

PEQI is an explainable score from 0–100.

Formula:

- Completion rate: 30%
- Quiz/exam score: 25%
- Learning consistency: 15%
- Review/retention activity: 10%
- AI-assisted learning engagement: 10%
- Recent activity: 10%

Levels:

- 90–100: Xuất sắc
- 80–89: Tốt
- 65–79: Đạt
- 50–64: Cần hỗ trợ
- 0–49: Nguy cơ thấp/chưa tham gia

Risk flags:

- `NOT_LOGGED_IN_RECENTLY`
- `LOW_COMPLETION`
- `LOW_SCORE`
- `TOO_FAST_COMPLETION`
- `NO_REVIEW_ACTIVITY`
- `INACTIVE_AFTER_ASSIGNMENT`
- `HIGH_ATTEMPTS_LOW_SCORE`

Output:

```json
{
  "score": 82,
  "level": "Tốt",
  "factors": {},
  "riskFlags": [],
  "recommendation": "..."
}
```

