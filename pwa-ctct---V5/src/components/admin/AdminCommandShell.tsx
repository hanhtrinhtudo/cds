import React from "react";
import { LogOut, ShieldCheck } from "lucide-react";
import AdminPanel, { AdminPanelProps, AdminPanelSection } from "../AdminPanel";
import { AppCaption, AppHeading, Badge, Button } from "../ui";
import AdminCommandDashboard from "./AdminCommandDashboard";
import AdminCommandNav, { AdminCommandSection } from "./AdminCommandNav";
import { PoliticalEducationCenter } from "./education";
import { ForceManagement } from "./force";
import { useCommandWorkflow } from "./workflow/useCommandWorkflow";

export interface AdminCommandShellProps extends Omit<AdminPanelProps, "activeSection" | "embedded"> {
  onLogout: () => void | Promise<void>;
}

const panelSection: Record<Exclude<AdminCommandSection, "overview" | "force" | "education">, AdminPanelSection> = {
  quality: "reports",
  reports: "reports",
  system: "organizations"
};

const sectionTitle: Record<Exclude<AdminCommandSection, "overview" | "force" | "education">, string> = {
  quality: "Theo dõi chất lượng",
  reports: "Báo cáo chỉ huy",
  system: "Hệ thống"
};

const roleLabel: Record<string, string> = {
  admin: "Quản trị viên",
  political_officer: "Cán bộ chính trị",
  instructor: "Giảng viên",
  "chi-huy": "Chỉ huy",
  chi_huy: "Chỉ huy"
};

export default function AdminCommandShell({ onLogout, ...adminProps }: AdminCommandShellProps) {
  const { workflow, selectSection, openLearnerProfile, openEvent, openRiskDetail } = useCommandWorkflow();
  const section = workflow.selectedSection;

  const renderSection = () => {
    if (section === "overview") {
      return (
        <AdminCommandDashboard
          users={adminProps.users}
          onNavigateSection={next => selectSection(next, "dashboard")}
          onOpenLearner={userId => openLearnerProfile(userId, "dashboard")}
          onOpenEvent={(eventId, userId) => openEvent(eventId, userId, "dashboard")}
          onOpenRisk={riskId => openRiskDetail(riskId, "dashboard")}
        />
      );
    }

    if (section === "force") {
      return (
        <ForceManagement
          users={adminProps.users}
          units={adminProps.units}
          topics={adminProps.topics}
          progress={adminProps.progress}
          selectedLearnerId={workflow.selectedLearnerId}
          selectedCaseId={workflow.selectedCaseId}
          onUpdateUserStatus={adminProps.onUpdateUserStatus}
          onChangeUserRole={adminProps.onChangeUserRole}
        />
      );
    }

    if (section === "education") {
      return (
        <PoliticalEducationCenter
          users={adminProps.users}
          topics={adminProps.topics}
          exams={adminProps.exams}
          questions={adminProps.questions}
        />
      );
    }

    return (
      <div className="space-y-4">
        <div>
          <AppHeading level="h1" variant="headingL">{sectionTitle[section]}</AppHeading>
          <AppCaption>Phạm vi quản lý theo quyền của tài khoản hiện tại.</AppCaption>
        </div>
        <AdminPanel {...adminProps} activeSection={panelSection[section]} embedded />
      </div>
    );
  };

  return (
    <div className="flex h-dvh min-h-dvh w-screen flex-col overflow-hidden bg-[var(--app-color-bg)] text-[var(--app-color-text-primary)]" id="admin-command-shell">
      <header className="shrink-0 bg-[var(--app-color-brand-primary-dark)] px-3 py-2 text-white md:px-5" id="admin-command-topbar">
        <div className="mx-auto flex min-h-14 max-w-[1440px] items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--app-color-brand-gold)] text-red-950">
              <ShieldCheck size={22} />
            </div>
            <div className="min-w-0">
              <AppHeading level="h1" variant="title" color="inverse" truncate className="uppercase tracking-wide">
                BAN CHỈ HUY PTKV3
              </AppHeading>
              <AppCaption color="inverse" truncate className="text-yellow-100">
                Trung tâm Chỉ huy Giáo dục Chính trị số
              </AppCaption>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden text-right sm:block">
              <AppCaption color="inverse" className="block font-bold">{adminProps.currentUser.fullName}</AppCaption>
              <Badge className="mt-1 border-yellow-300/30 bg-yellow-300/15 text-yellow-100">
                {roleLabel[String(adminProps.currentUser.role)] || "Cán bộ quản lý"}
              </Badge>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onLogout}
              aria-label="Đăng xuất"
              className="text-white hover:bg-white/10"
              leftIcon={<LogOut size={17} />}
            >
              <span className="hidden sm:inline">Đăng xuất</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <AdminCommandNav
          active={section}
          onChange={next => selectSection(next, next === "force" ? "force" : next === "quality" ? "quality" : next === "reports" ? "reports" : "dashboard")}
        />
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain" id="admin-command-main">
          <div className="mx-auto w-full max-w-[1200px] p-3 pb-[calc(1rem+env(safe-area-inset-bottom))] md:p-5">
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  );
}
