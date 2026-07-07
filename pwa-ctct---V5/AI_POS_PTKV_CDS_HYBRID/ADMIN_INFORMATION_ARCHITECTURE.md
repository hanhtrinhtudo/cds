# Admin Information Architecture

## Top bar

- BAN CHỈ HUY PTKV3
- Trung tâm Chỉ huy Giáo dục Chính trị số
- Tên cán bộ hiện tại
- Badge vai trò
- Đăng xuất

## Điều hướng chính

| Mục | Nội dung hiện tại | Nguồn logic |
|---|---|---|
| Tổng quan | Chỉ số chỉ huy, tiến độ đơn vị, học viên cần hỗ trợ, hoạt động mới, PEQI | Analytics capability |
| Quân số | Danh sách và trạng thái tài khoản | AdminPanel users |
| Đơn vị | Cây tổ chức, alias, thành viên, migration | AdminPanel organizations |
| Hoạt động | Hoạt động học tập theo phạm vi | AdminPanel reports |
| Kết quả | Kết quả và thống kê | AdminPanel reports |
| Học viên | Hồ sơ/danh sách học viên | AdminPanel users |
| Báo cáo | Báo cáo, analytics và audit hiện hữu | AdminPanel reports |
| Cấu hình | Cấu hình tổ chức hiện có | AdminPanel organizations |

## Nguyên tắc IA

1. Tổng quan chỉ huy là màn mặc định, không phải learner Dashboard.
2. Điều hướng quản trị là độc lập và không dùng learner bottom tabs.
3. Trên mobile, navigation cuộn ngang trong phạm vi riêng; trang không tràn ngang.
4. Trên desktop, navigation chuyển thành rail bên trái.
5. Các mục chưa có backend analytics không hiển thị dữ liệu mô phỏng.

## Phần cố ý chưa tách sâu

Hoạt động, Kết quả, Học viên và Cấu hình đang ánh xạ tới các section an toàn của `AdminPanel`. Việc tách từng module nghiệp vụ riêng chỉ nên thực hiện sau khi analytics dispatcher live và có contract dữ liệu được xác minh.
