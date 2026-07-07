# Role Permission Matrix

| Capability | Học viên | Giảng viên | Cán bộ chính trị | Chỉ huy | Quản trị viên |
|---|---:|---:|---:|---:|---:|
| Học tập | Yes | Yes | Yes | Yes | Yes |
| Làm bài/ôn tập | Yes | Yes | Yes | Yes | Yes |
| Xem kết quả cá nhân | Yes | Yes | Yes | Yes | Yes |
| Quản lý quân số | No | No | Yes | Yes | Yes |
| Xem báo cáo đơn vị | No | Yes | Yes | Yes | Yes |
| Quản lý chuyên đề | No | Yes | Yes | No | Yes |
| Quản lý kỳ kiểm tra | No | No | Yes | Yes | Yes |
| Quản trị hệ thống | No | No | No | No | Yes |

Role labels normalize `member/user`, `instructor`, `political_officer`, `chi-huy/chi_huy`, and `admin`. This is a read-only product matrix; enforcement remains with existing auth/backend permissions.

