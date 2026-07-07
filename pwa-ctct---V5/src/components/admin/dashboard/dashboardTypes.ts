import { AnalyticsEventRecord, AnalyticsSummary, PEQIResult } from "../../../services/analyticsService";
import { User } from "../../../types";
import { AdminCommandSection } from "../AdminCommandNav";

export type CommandDashboardRange = "today" | "7d" | "30d";
export type WidgetTone = "neutral" | "good" | "warning" | "danger";
export type DrillDownMode = "kpi" | "unit" | "learner" | "event";

export interface CommandDashboardFilters {
  range: CommandDashboardRange;
  unit: string;
  eventType?: string;
  search?: string;
}

export interface CommandKpi {
  id: string;
  label: string;
  value?: string | number | null;
  trend?: string;
  tone: WidgetTone;
  description?: string;
}

export interface UnitProgressItem {
  unit: string;
  users?: number;
  activeUsers?: number;
  completionRate?: number;
  averageScore?: number;
  peqiAverage?: number;
}

export interface LearnerSignal {
  userId: string;
  fullName: string;
  username?: string;
  unit?: string;
  peqi?: number;
  completedTopics?: number;
  averageScore?: number;
  latestActivity?: string;
  activityCount: number;
}

export interface CommandAlert {
  id: string;
  severity: "info" | "warning" | "danger";
  title: string;
  description: string;
  scope: "user" | "unit" | "topic" | "system";
  recommendedAction: string;
}

export interface DrillDownSelection {
  mode: DrillDownMode;
  title: string;
  kpiId?: string;
  unit?: UnitProgressItem;
  learner?: LearnerSignal | User;
  event?: AnalyticsEventRecord;
}

export interface CommandDashboardData {
  supportsAnalytics: boolean;
  summary: AnalyticsSummary;
  events: AnalyticsEventRecord[];
  units: UnitProgressItem[];
  learners: LearnerSignal[];
  kpis: CommandKpi[];
  alerts: CommandAlert[];
  peqiAverage?: number;
}

export interface CommandDashboardWidgetProps {
  loading: boolean;
  available: boolean;
}

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  section: AdminCommandSection;
}

export interface DrillDownPanelProps {
  loading?: boolean;
  selection: DrillDownSelection | null;
  events: AnalyticsEventRecord[];
  onClose: () => void;
  onOpenLearner?: (userId: string) => void;
}
