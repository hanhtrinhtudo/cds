# Sprint 7.3D.5 Command Workflow Report

## Executive summary

Sprint 7.3D.5 closure runtime QA is complete.

Authenticated admin QA now reaches the Digital Command Workflow after a minimal bootstrap timeout fix. The shared Electronic Learning Profile v2 opens from Force Management, Commander Actions remain touch-safe, and Education Case Management works as a local draft workflow with status transitions.

Final decision: **COMMAND_WORKFLOW_PASS_WITH_MINOR_RISKS**.

## Files changed

- `src/App.tsx`
  - Added a safe bootstrap timeout wrapper for `authService.me()`, `learningService.getTopics()` and `examService.getExams()`.
  - `authService.me()` timeout resolves to `null`, returning the app to normal login instead of trusting cached user data.
  - Learning/exam bootstrap timeout resolves to empty arrays so the shell can render honest no-data/fallback states.
  - Optional legacy data and persistence hydration now run in the background after the shell is unblocked.
- `src/components/admin/dashboard/CommandKpiGrid.tsx`
  - Ensured the KPI area always renders a loading/no-data/live state.
  - Fixed user-facing Vietnamese text in the KPI fallback.
- `AI_POS_PTKV_CDS_HYBRID/SPRINT_7_3D_5_COMMAND_WORKFLOW_REPORT.md`
- `AI_POS_PTKV_CDS_HYBRID/RUNTIME_BOOTSTRAP_TIMEOUT_FIX.md`

Previously implemented workflow files remain in place:

- `src/components/admin/workflow/useCommandWorkflow.ts`
- `src/components/admin/force/ElectronicLearningProfileV2.tsx`
- `src/components/admin/cases/*`
- Dashboard/Force Management workflow wiring files.

## Runtime blocker fixed

Observed blocker:

- After authenticated login, the app could remain indefinitely on `ĐANG ĐỒNG BỘ CƠ SỞ DỮ LIỆU BAN CHỈ HUY...`.
- Cause: bootstrap/auth/data loading had no timeout path for slow or stalled legacy Apps Script calls.

Fix applied:

- `authService.me()` timeout returns `null`.
- This does not grant access, does not seed storage, and does not trust cached user data.
- Topic/exam loading timeout returns empty arrays, allowing UI fallback/no-data states instead of a frozen shell.
- Existing contracts, payloads, services and storage semantics remain unchanged.

## Admin runtime QA

Account type: admin test account.

### 390×844

Result: PASS.

- Admin Command Shell opened after normal login.
- Learner bottom navigation was not shown.
- Dashboard Chỉ huy rendered.
- Dashboard areas visible/reachable:
  - KPI area
  - Hoạt động realtime
  - Tiến độ đơn vị
  - Top đơn vị
  - Top học viên
  - Cảnh báo
  - Truy cập nhanh
  - Drill-down/fallback area through dashboard interactions
- Analytics unavailable state was honest: no fake data.
- Quick Action `Xem quân số` opened `Quản lý lực lượng`.
- Force Management tabs visible:
  - Tổng quan
  - Quân số
  - Hồ sơ
  - Phê duyệt
  - Phân quyền
- Quân số roster rendered from real users.
- `Xem hồ sơ` opened shared Electronic Learning Profile v2.
- Profile v2 rendered:
  - Tóm tắt chỉ huy
  - Bằng chứng học tập
  - Ma trận rủi ro
  - Hỗ trợ quyết định
  - Timeline hoạt động
  - Hành động chỉ huy
  - Quản lý vụ việc giáo dục
- Commander Action buttons measured at 44px height.
- `Tạo vụ việc` created a local draft.
- Draft status changed successfully:
  - monitoring → improved → closed
- Case timeline recorded status changes.
- No horizontal overflow observed.

### 430×932

Result: PASS.

- Profile v2 remained readable.
- Case panel remained usable.
- Draft case stayed in `closed` state after transition.
- Commander Actions remained 44px.
- No horizontal overflow observed.

## Dashboard regression

Result: PASS_WITH_FALLBACK.

- Dashboard Chỉ huy renders in admin shell.
- All required dashboard modules are present.
- Analytics data was not available in this runtime session, so widgets showed loading/no-data/fallback states rather than fake numbers.
- `Xem quân số` quick action navigated to Force Management.

## Force Management regression

Result: PASS.

- `Quản lý lực lượng` opens.
- `Quân số` opens.
- Roster renders real user rows.
- Roster `Xem hồ sơ` opens the shared Profile v2.
- No duplicate standalone `Học viên` nav was observed in the admin shell.

## Learner regression

Account type: learner test account.

Result: PASS.

- Learner login succeeded through normal login.
- Learner shell rendered.
- Bottom navigation rendered:
  - Trang chủ
  - Học tập
  - Kiểm tra
  - Hỏi AI
  - Cá nhân
- Admin shell was not present.
- Force/Command Workflow was not visible.
- No horizontal overflow observed.

## Admin logout

Result: PASS.

- Admin logout returned to the login screen.
- Admin shell was removed.
- No session bypass or storage seeding was used.

## Validation

- `npm run lint`: PASS.
- `npm run build`: PASS.
- `npx vite preview --host 127.0.0.1 --port 4173`: HTTP 200 using the active preview server.
- Existing Vite chunk-size warning remains informational and unrelated to this sprint.

## Known limitations / minor risks

- Analytics runtime was unavailable or returned fallback during QA, so Top Learner / Recent Activity one-click from live analytics rows could not be exercised with live rows.
- The same shared Profile v2 path was validated through Force Management roster, and dashboard quick action routing was validated.
- Case Management remains local draft state only.
- No backend case persistence is claimed.
- No notification, retest assignment, meeting, PDF export, or external AI action is sent.

## Final decision

**COMMAND_WORKFLOW_PASS_WITH_MINOR_RISKS**
