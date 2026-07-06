import { apiClient } from "./apiClient";
import { Question, QuizAttempt } from "../types";
import { isLegacyAppsScriptAuthMode } from "./authService";
import { cdsLegacyService } from "./cdsLegacyService";
import { examService } from "./examService";

export const quizService = {
  async createQuestion(question: Question): Promise<Question> {
    return apiClient.post<Question>("/api/quiz/questions", question);
  },

  async updateQuestion(id: string, updates: Partial<Question>): Promise<Question> {
    return apiClient.patch<Question>(`/api/quiz/questions/${id}`, updates);
  },
  async getQuestions(): Promise<Question[]> {
    // Ôn tập is intentionally the only flow that may use the static CDS question file directly.
    if (isLegacyAppsScriptAuthMode()) return cdsLegacyService.getQuestions();
    return apiClient.get<Question[]>("/api/quiz/questions");
  },

  async getPracticeQuestions(): Promise<Question[]> {
    return this.getQuestions();
  },

  async getMockExamBanks() {
    return examService.getMockExams();
  },

  async getOfficialExamBanks() {
    return examService.getOfficialExams();
  },

  async getQuestionsByTopic(topicId: string): Promise<Question[]> {
    if (isLegacyAppsScriptAuthMode()) {
      const questions = await cdsLegacyService.getQuestions();
      return questions.filter(q => q.topicId === topicId);
    }
    return apiClient.get<Question[]>(`/api/quiz/by-topic/${topicId}`);
  },

  async startQuiz(topicId: string): Promise<QuizAttempt> {
    return apiClient.post<QuizAttempt>("/api/quiz/start", { topicId });
  },

  async submitQuiz(attemptId: string, answers: { [questionId: string]: number[] }): Promise<{ attempt: QuizAttempt; isPassed: boolean; score: number }> {
    return apiClient.post<{ attempt: QuizAttempt; isPassed: boolean; score: number }>("/api/quiz/submit", { attemptId, answers });
  },

  async getQuizHistory(): Promise<QuizAttempt[]> {
    if (isLegacyAppsScriptAuthMode()) return cdsLegacyService.getQuizHistory();
    return apiClient.get<QuizAttempt[]>("/api/quiz/history");
  }
};
export default quizService;
