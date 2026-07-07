import { AccountStatus, LearningProgress, LearningTopic, User, UserRole } from "../../../types";
import { AnalyticsEventRecord, AnalyticsSummary, PEQIResult } from "../../../services/analyticsService";

export type ForceTab = "overview" | "roster" | "profile" | "approval" | "permissions";

export interface LearnerProfileData {
  summary: AnalyticsSummary;
  peqi: PEQIResult | null;
  events: AnalyticsEventRecord[];
}

export type ProfileLoadState = "loading" | "live" | "unavailable";

export interface ForceSharedProps {
  users: User[];
  topics: LearningTopic[];
  progress: LearningProgress[];
  units: Array<{ id: string; name: string }>;
  onUpdateUserStatus: (userId: string, status: AccountStatus) => void;
  onChangeUserRole?: (userId: string, role: UserRole) => Promise<void>;
}

export interface ProfileSectionProps {
  user: User;
  data: LearnerProfileData;
  state: ProfileLoadState;
}

