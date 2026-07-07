# Decision Support Rules

All results are labeled evidence or proposal and use no external AI.

| Risk | Activation evidence | Suggested response |
|---|---|---|
| LOW_PEQI | PEQI flag or score below 65 | Review full progress and recent results |
| LOW_SCORE | Any quiz below 6; danger at three | Assign review for low-score topics |
| LOW_COMPLETION | PEQI flag or explicitly zero completed topics | Remind required completion |
| NO_REVIEW_ACTIVITY | Events exist but no review in 30 days | Require answer review |
| INACTIVE_RECENTLY | Last activity at least 7 days ago | Contact learner; danger at 14 days |
| FAST_COMPLETION_PATTERN | Completion event below 60 seconds | Compare duration and test result |
| HIGH_ATTEMPTS_LOW_SCORE | At least three attempts and three low scores | Meeting and retest proposal |
| LOW_NEWS_ENGAGEMENT | Events exist but no news view in 30 days | Suggest relevant news content |

Inactive rules remain stable/unknown when source data is missing; absence of analytics is not interpreted as misconduct.

