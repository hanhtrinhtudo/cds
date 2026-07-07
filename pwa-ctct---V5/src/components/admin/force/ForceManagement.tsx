import React, { useEffect, useState } from "react";
import { User } from "../../../types";
import { analyticsService } from "../../../services/analyticsService";
import { apiClient } from "../../../services/apiClient";
import { AppCaption, AppHeading, Chip } from "../../ui";
import ApprovalQueue from "./ApprovalQueue";
import ElectronicLearningProfileV2 from "./ElectronicLearningProfileV2";
import ForceOverview from "./ForceOverview";
import { ForceSharedProps, ForceTab } from "./forceTypes";
import PersonnelRoster from "./PersonnelRoster";
import RolePermissionPanel from "./RolePermissionPanel";

const tabs: Array<{ id: ForceTab; label: string }> = [
  { id: "overview", label: "Tổng quan" }, { id: "roster", label: "Quân số" },
  { id: "profile", label: "Hồ sơ" }, { id: "approval", label: "Phê duyệt" },
  { id: "permissions", label: "Phân quyền" }
];

export default function ForceManagement(props: ForceSharedProps & { initialTab?: ForceTab; selectedLearnerId?: string; selectedCaseId?: string }) {
  const [tab, setTab] = useState<ForceTab>(props.initialTab || "overview");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [analytics, setAnalytics] = useState({ loading: true, available: false, activityToday: undefined as number | undefined });
  useEffect(() => { if (props.initialTab) setTab(props.initialTab); }, [props.initialTab]);
  useEffect(() => {
    if (!props.selectedLearnerId) return;
    setSelectedUser(props.users.find(user => user.id === props.selectedLearnerId) || null);
    setTab("profile");
  }, [props.selectedLearnerId, props.users]);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const token = apiClient.getAuthToken();
      if (!token) { if (!cancelled) setAnalytics({ loading: false, available: false, activityToday: undefined }); return; }
      try {
        const health = await analyticsService.health(token);
        if (!analyticsService.isSupported(health)) throw new Error("unsupported");
        const summary = await analyticsService.getAdminSummary(token, { range: "today" });
        if (!cancelled) setAnalytics({ loading: false, available: true, activityToday: summary.activeToday ?? summary.loggedInToday });
      } catch { if (!cancelled) setAnalytics({ loading: false, available: false, activityToday: undefined }); }
    };
    void load(); return () => { cancelled = true; };
  }, []);
  const openProfile = (user: User) => { setSelectedUser(user); setTab("profile"); };
  const unitName = (user: User) => props.units.find(unit => unit.id === user.unitId)?.name || user.organizationName || user.unitId || "Chưa xác định";
  return <div className="space-y-4" id="force-management">
    <div><AppCaption overline>Quản lý lực lượng</AppCaption><AppHeading level="h1" variant="headingL">Quản lý lực lượng</AppHeading><AppCaption>Quân số, hồ sơ học tập, phê duyệt và phân quyền trong một đầu mối.</AppCaption></div>
    <nav aria-label="Chức năng quản lý lực lượng" className="no-scrollbar flex gap-2 overflow-x-auto pb-1">{tabs.map(item => <Chip key={item.id} selected={tab === item.id} onClick={() => setTab(item.id)}>{item.label}</Chip>)}</nav>
    {tab === "overview" && <ForceOverview users={props.users} units={props.units} analyticsLoading={analytics.loading} analyticsAvailable={analytics.available} activityToday={analytics.activityToday} />}
    {tab === "roster" && <PersonnelRoster users={props.users} units={props.units} onOpenProfile={openProfile} onUpdateUserStatus={props.onUpdateUserStatus} onChangeUserRole={props.onChangeUserRole} />}
    {tab === "profile" && (selectedUser ? <ElectronicLearningProfileV2 user={selectedUser} progress={props.progress} topics={props.topics} unitName={unitName(selectedUser)} selectedCaseId={props.selectedCaseId} onBack={() => setTab("roster")} /> : props.selectedLearnerId ? <div className="pixel-surface-flat p-3"><AppHeading level="h2" variant="title">Không tìm thấy học viên</AppHeading><AppCaption>Mã học viên: {props.selectedLearnerId}. Kiểm tra đồng bộ quân số hoặc mở hồ sơ từ danh sách.</AppCaption></div> : <PersonnelRoster users={props.users} units={props.units} onOpenProfile={openProfile} onUpdateUserStatus={props.onUpdateUserStatus} onChangeUserRole={props.onChangeUserRole} />)}
    {tab === "approval" && <ApprovalQueue users={props.users} onUpdateUserStatus={props.onUpdateUserStatus} />}
    {tab === "permissions" && <RolePermissionPanel />}
  </div>;
}
