# Sprint 7.3A — Admin Command Shell Report

## 1. Executive summary

Đã tách admin/chỉ huy khỏi learner mobile shell. Admin đăng nhập qua luồng chuẩn sẽ vào thẳng **Tổng quan chỉ huy**, không còn thấy learner Dashboard hoặc learner bottom navigation. Learner tiếp tục dùng shell cũ.

Final decision: **ADMIN_COMMAND_SHELL_PASS**

## 2. Files created

- `src/components/admin/AdminCommandShell.tsx`
- `src/components/admin/AdminCommandDashboard.tsx`
- `src/components/admin/AdminCommandNav.tsx`
- `src/components/admin/AdminLearnerProfile.tsx`
- `src/components/admin/AdminUnitAnalytics.tsx`
- `AI_POS_PTKV_CDS_HYBRID/ADMIN_COMMAND_SHELL_ARCHITECTURE.md`
- `AI_POS_PTKV_CDS_HYBRID/ADMIN_INFORMATION_ARCHITECTURE.md`
- `AI_POS_PTKV_CDS_HYBRID/SPRINT_7_3A_ADMIN_COMMAND_SHELL_REPORT.md`

## 3. Files changed

- `src/App.tsx`: thêm role branch và early-return admin shell.
- `src/components/AdminPanel.tsx`: thêm controlled section/embedded presentation mode; logic quản trị giữ nguyên.

## 4. Implementation

- Vai trò admin: `admin`, `political_officer`, `instructor`, `chi-huy`, `chi_huy`.
- Vai trò learner tiếp tục learner shell 5 tabs.
- Admin navigation gồm Tổng quan, Quân số, Đơn vị, Hoạt động, Kết quả, Học viên, Báo cáo, Cấu hình.
- Top bar hiển thị nhận diện Ban Chỉ huy, tên cán bộ, vai trò và đăng xuất.
- Command dashboard ưu tiên các chỉ số được yêu cầu; analytics chưa sẵn sàng thì dùng fallback rõ ràng và `--`, không tạo dữ liệu giả.
- AdminPanel cũ được nhúng an toàn cho Quân số, Đơn vị và Báo cáo.

## 5. Runtime QA

### Learner — 390×844

- Đăng nhập qua form chuẩn: PASS.
- Dashboard learner xuất hiện: PASS.
- Learner bottom navigation xuất hiện: PASS.
- Admin shell không xuất hiện: PASS.
- Không tràn ngang: PASS.

### Admin — 390×844

- Đăng nhập qua form chuẩn: PASS.
- Màn mặc định là Tổng quan chỉ huy: PASS.
- Learner bottom navigation không tồn tại trong DOM: PASS.
- Quân số mở đúng users panel: PASS.
- Đơn vị mở đúng organizations panel: PASS.
- Báo cáo mở đúng reports panel: PASS.
- Không tràn ngang: PASS.
- Logout qua cùng luồng hiện hữu: PASS.

### Admin — 430×932

- Admin shell hiển thị: PASS.
- 8 mục điều hướng có mặt: PASS.
- Main workspace cuộn dọc độc lập: PASS.
- Không tràn ngang: PASS.

## 6. Analytics status

Live `analytics.health` hiện chưa trả capability analytics. Command Center đã hiển thị fallback trung thực; các chức năng tài khoản/tổ chức/báo cáo cũ vẫn hoạt động. Đây là giới hạn backend đã biết, không phải lỗi shell.

## 7. Validation

- `npm run lint`: PASS.
- `npm run build`: PASS.
- Vite production build: PASS (còn cảnh báo chunk lớn đã tồn tại).
- Preview `http://127.0.0.1:4173`: HTTP 200 và runtime PASS.
- Auth/API/persistence/service contracts: không thay đổi.

## 8. Known limitations

- Hoạt động/Kết quả/Học viên/Cấu hình hiện tái sử dụng section gần nhất của AdminPanel để tránh refactor nghiệp vụ rủi ro.
- Chỉ số analytics/PEQI cần dispatcher analytics live để có dữ liệu thật.
- Bundle vẫn có cảnh báo chunk lớn; không phát sinh từ thay đổi contract nghiệp vụ.

## 9. Final status

**ADMIN_COMMAND_SHELL_PASS**
