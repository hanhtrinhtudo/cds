import { PEQIResult } from "../../../services/analyticsService";
import { CaseActionType, EducationCase, EducationCaseSeverity, EducationCaseStatus } from "./caseTypes";

export const caseStatusLabel: Record<EducationCaseStatus, string> = { monitoring: "Đang theo dõi", improved: "Đã cải thiện", closed: "Đóng vụ việc" };
export const caseActionLabel: Record<CaseActionType, string> = { remind_learning: "Nhắc học", assign_review: "Giao ôn tập", assign_retest: "Giao kiểm tra lại", schedule_meeting: "Hẹn trao đổi", monitor_7_days: "Theo dõi 7 ngày", export_profile: "Xuất hồ sơ PDF" };

export const createCaseDraft = (input: { learnerId: string; learnerName: string; unit: string; peqi: PEQIResult | null; reasons: string[]; riskFlags: string[]; severity: EducationCaseSeverity; action?: CaseActionType }): EducationCase => {
  const now = new Date().toISOString();
  const actions: CaseActionType[] = input.action ? [input.action] : ["assign_review", "monitor_7_days"];
  return { id: `DRAFT-${Date.now()}`, learnerId: input.learnerId, learnerName: input.learnerName, unit: input.unit, title: `Theo dõi hỗ trợ học tập: ${input.learnerName}`, reasons: input.reasons.length ? input.reasons : ["Cần tiếp tục theo dõi dữ liệu học tập"], riskFlags: input.riskFlags, severity: input.severity, assigneeRole: "Cán bộ chính trị", recommendedActions: actions, status: "monitoring", createdAt: now, updatedAt: now, dueAt: new Date(Date.now() + 7 * 86400000).toISOString(), source: "electronic_profile", evidenceRefs: input.riskFlags, timeline: [{ id: `timeline-${Date.now()}`, time: now, label: "Tạo bản nháp xử lý", detail: input.peqi ? `PEQI ${input.peqi.score} · ${input.peqi.level}` : "Chưa có PEQI" }] };
};

