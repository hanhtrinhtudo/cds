# Admin Command Shell Architecture

## Mục tiêu

Tách trải nghiệm quản trị/chỉ huy khỏi ứng dụng học viên mà không thay đổi auth, API, persistence, analytics contract hoặc logic nghiệp vụ hiện có.

## Điểm phân nhánh

`App.tsx` phân loại vai trò ngay sau bước auth/loading:

- Học viên (`member`, `user`): tiếp tục dùng nguyên learner shell và 5 bottom tabs.
- Quản trị/chỉ huy (`admin`, `political_officer`, `instructor`, `chi-huy`, `chi_huy`): early-return `AdminCommandShell`.

Không có thao tác giả lập phiên hoặc chuyển route. Quyết định shell chỉ dựa trên `currentUser.role` từ phiên đăng nhập hiện hữu.

## Cấu trúc

```text
AdminCommandShell
├── Admin top bar
├── AdminCommandNav
└── Main scroll area
    ├── AdminCommandDashboard (mặc định)
    └── AdminPanel (embedded, controlled section)
```

`AdminPanel` vẫn sở hữu toàn bộ state và hành vi quản trị cũ. Hai prop bổ sung chỉ điều khiển trình bày:

- `activeSection`: đồng bộ section theo điều hướng shell.
- `embedded`: ẩn header/sub-tabs cũ để tránh hai tầng điều hướng.

## Phân tách trách nhiệm

- Shell: thông tin phiên, navigation, logout, responsive layout.
- Dashboard: đọc analytics theo capability; không dựng số giả.
- AdminPanel: quản lý tổ chức, quân số, nội dung, kỳ thi, báo cáo hiện hữu.
- Services: không thay đổi.

## Fallback analytics

Nếu `analytics.health` chưa hỗ trợ capability, Command Center hiển thị trạng thái trung thực. Chỉ số phụ thuộc analytics dùng `--`; quân số có thể dùng danh sách người dùng đã tải thật.

## Khả năng tương thích

- Learner shell không bị đổi cấu trúc.
- Legacy Apps Script mode giữ nguyên hạn chế nội dung hiện hữu.
- Logout tiếp tục gọi cùng `handleLogout`.
- Không có learner bottom navigation trong admin DOM.
