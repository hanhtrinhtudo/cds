export type EducationCaseStatus = "monitoring" | "improved" | "closed";
export type EducationCaseSeverity = "info" | "warning" | "danger";
export type CaseActionType = "remind_learning" | "assign_review" | "assign_retest" | "schedule_meeting" | "monitor_7_days" | "export_profile";

export interface EducationCaseTimelineEntry { id: string; time: string; label: string; detail?: string; }
export interface EducationCase {
  id: string; learnerId: string; learnerName: string; unit: string; title: string;
  reasons: string[]; riskFlags: string[]; severity: EducationCaseSeverity;
  assigneeRole: string; assigneeName?: string; recommendedActions: CaseActionType[];
  status: EducationCaseStatus; createdAt: string; updatedAt: string; dueAt?: string;
  source: string; evidenceRefs: string[]; timeline: EducationCaseTimelineEntry[];
}

