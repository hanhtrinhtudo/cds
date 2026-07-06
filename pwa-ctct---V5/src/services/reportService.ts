import { apiClient } from "./apiClient";
import { isLegacyAppsScriptAuthMode } from "./authService";
import { cdsLegacyService } from "./cdsLegacyService";

export interface PersonalReport {
  completionRate: number;
  completedCount: number;
  avgScore: number;
  weakTopics: string[];
  recommendations: string[];
  examAttemptsCount: number;
  passedExamsCount: number;
}

export interface InstructorReport {
  totalLearners: number;
  avgCompletionRate: number;
  totalQuizzesTaken: number;
  inactiveLearnersCount: number;
  inactiveLearners: string[];
}

export interface UnitReport {
  id: string;
  name: string;
  count: number;
  completionRate: number;
}

export interface AdminReport {
  totalUsers: number;
  pendingUsers: number;
  activeUsers: number;
  totalTopics: number;
  totalExams: number;
  totalLogs: number;
}

export interface RankingEntry {
  rank: number;
  userId: string;
  fullName: string;
  unitId: string;
  unitName: string;
  points: number;
  completionRate: number;
}

export const reportService = {
  async getRankings(): Promise<RankingEntry[]> {
    if (isLegacyAppsScriptAuthMode()) return cdsLegacyService.getLeaderboard();
    return apiClient.get<RankingEntry[]>("/api/rankings");
  },
  async getPersonalReport(): Promise<PersonalReport> {
    if (isLegacyAppsScriptAuthMode()) {
      const myResults = await cdsLegacyService.getMyResults();
      const tryResults = await cdsLegacyService.getTryResults();
      const scores = [...myResults, ...tryResults].map(result => result.score).filter(score => typeof score === "number");
      const avgScore = scores.length ? Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1)) : 0;
      return {
        completionRate: 70,
        completedCount: 1,
        avgScore,
        weakTopics: [],
        recommendations: ["Tiếp tục ôn trắc nghiệm và xem lại giải thích sau mỗi bài làm."],
        examAttemptsCount: myResults.length,
        passedExamsCount: myResults.filter(result => result.passed).length
      };
    }
    return apiClient.get<PersonalReport>("/api/reports/personal");
  },

  async getInstructorReport(): Promise<InstructorReport> {
    return apiClient.get<InstructorReport>("/api/reports/instructor");
  },

  async getUnitReport(): Promise<UnitReport[]> {
    return apiClient.get<UnitReport[]>("/api/reports/unit");
  },

  async getAdminReport(): Promise<AdminReport> {
    return apiClient.get<AdminReport>("/api/reports/admin");
  }
};
export default reportService;
