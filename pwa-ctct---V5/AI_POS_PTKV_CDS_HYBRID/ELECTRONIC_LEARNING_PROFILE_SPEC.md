# Electronic Learning Profile Specification

The profile contains all required areas:

1. Thông tin quân nhân.
2. Thông tin đơn vị.
3. Tiến độ học theo chuyên đề.
4. Lịch sử kiểm tra.
5. Lịch sử ôn tập.
6. Lịch sử hỏi AI without sensitive content.
7. Lịch sử đọc tin tức.
8. PEQI.
9. Timeline hoạt động.
10. Đề xuất hỗ trợ từ AI.

## Loading and availability

Account/unit details render independently from analytics. Analytics loading displays a skeleton. Unsupported or failed analytics displays a compact informational state, while each analytics section provides a specific empty state.

## Recommendation rules

Recommendations are deterministic and transparent:

- `LOW_SCORE`: Giao ôn tập lại chuyên đề có điểm thấp.
- `LOW_COMPLETION`: Nhắc hoàn thành nội dung bắt buộc.
- `NO_REVIEW_ACTIVITY`: Yêu cầu xem lại đáp án và ôn tập.
- `NOT_LOGGED_IN_RECENTLY`: Liên hệ nhắc tham gia học tập.

No external AI call is made. With no PEQI/events, the profile says that data is insufficient.

## Privacy

AI event count/category/resource/time may appear. Full prompt, question, response or answer content is never requested for display and never rendered.

