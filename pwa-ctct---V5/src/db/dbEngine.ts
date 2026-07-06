import {
  AIChatMessage,
  AuditLog,
  Exam,
  ExamAnswer,
  ExamAttempt,
  LearningAssignment,
  LearningProgress,
  LearningSection,
  LearningStatus,
  LearningTopic,
  News,
  Notification,
  Question,
  QuizAttempt,
  ReportSnapshot,
  User,
  UserAuthRecord
} from "../types";
import { aiRepository } from "./repositories/aiRepository";
import { auditRepository } from "./repositories/auditRepository";
import { examRepository } from "./repositories/examRepository";
import { learningRepository } from "./repositories/learningRepository";
import { newsRepository } from "./repositories/newsRepository";
import { notificationRepository } from "./repositories/notificationRepository";
import { quizRepository } from "./repositories/quizRepository";
import { reportRepository } from "./repositories/reportRepository";
import { unitRepository } from "./repositories/unitRepository";
import { userRepository } from "./repositories/userRepository";

const buildDefaultSections = (topic: LearningTopic): LearningSection[] => [
  {
    id: `sec_${topic.id}_1`,
    topicId: topic.id,
    title: "Phần 1: Khái niệm, vai trò và ý nghĩa cốt lõi",
    content: `Nội dung phần 1 giới thiệu bối cảnh, ý nghĩa và vai trò thực tiễn của bài học "${topic.title}".`,
    order: 1,
    required: true
  },
  {
    id: `sec_${topic.id}_2`,
    topicId: topic.id,
    title: "Phần 2: Các nội dung trọng tâm và văn bản liên quan",
    content: `Phân tích các quy định, văn bản và nội dung lý luận của chuyên đề "${topic.title}".`,
    order: 2,
    required: true
  },
  {
    id: `sec_${topic.id}_3`,
    topicId: topic.id,
    title: "Phần 3: Trách nhiệm và hành động thực tiễn",
    content: `Xác định trách nhiệm của cán bộ, chiến sĩ trong việc học tập và vận dụng chuyên đề "${topic.title}".`,
    order: 3,
    required: false
  }
];

export const dbEngine = {
  getUsers: (): Promise<User[]> => userRepository.getUsers(),
  async getUserById(id: string): Promise<User | undefined> {
    return (await userRepository.getUserById(id)) || undefined;
  },
  async getUserByEmail(email: string): Promise<User | undefined> {
    return (await userRepository.getUserByEmail(email)) || undefined;
  },
  async getAuthUserByLogin(login: string): Promise<UserAuthRecord | undefined> {
    return (await userRepository.getAuthUserByLogin(login)) || undefined;
  },
  updateUser: (id: string, updates: Partial<User>): Promise<User> => userRepository.updateUser(id, updates),
  updateUserPassword: (id: string, passwordHash: string, mustChangePassword: boolean): Promise<void> =>
    userRepository.updatePassword(id, passwordHash, mustChangePassword),
  addUser: (user: User, passwordHash: string): Promise<User> => userRepository.addUser(user, passwordHash),

  getUnits: () => unitRepository.getUnits(),

  getTopics: (): Promise<LearningTopic[]> => learningRepository.getTopics(),
  async getTopicById(id: string): Promise<LearningTopic | undefined> {
    return (await learningRepository.getTopicById(id)) || undefined;
  },
  async addTopic(topic: LearningTopic): Promise<LearningTopic> {
    const created = await learningRepository.addTopic(topic);
    await learningRepository.addSections(buildDefaultSections(created));
    return created;
  },
  updateTopic: (id: string, updates: Partial<LearningTopic>): Promise<LearningTopic> =>
    learningRepository.updateTopic(id, updates),
  getSectionsByTopicId: (topicId: string): Promise<LearningSection[]> =>
    learningRepository.getSectionsByTopicId(topicId),
  getAssignments: (): Promise<LearningAssignment[]> => learningRepository.getAssignments(),
  getAssignmentsForUser: (userId: string, unitId: string): Promise<LearningAssignment[]> =>
    learningRepository.getAssignmentsForUser(userId, unitId),
  addAssignment: (assignment: LearningAssignment): Promise<LearningAssignment> =>
    learningRepository.addAssignment(assignment),
  getProgress: (): Promise<LearningProgress[]> => learningRepository.getAllProgress(),
  getProgressForUser: (userId: string): Promise<LearningProgress[]> =>
    learningRepository.getProgressForUser(userId),
  async updateProgress(
    userId: string,
    topicId: string,
    progressPercent: number,
    status: LearningStatus,
    needReview = false
  ): Promise<LearningProgress> {
    let percent = Math.max(0, Math.min(100, Number(progressPercent)));
    const attempts = await quizRepository.getQuizAttemptsForUser(userId);
    const hasPassedQuiz = attempts.some(attempt => attempt.topicId === topicId && attempt.score >= 6);
    let resolvedStatus = status || LearningStatus.IN_PROGRESS;

    if (resolvedStatus === LearningStatus.COMPLETED && !hasPassedQuiz) {
      resolvedStatus = LearningStatus.NEED_REVIEW;
      needReview = true;
    } else if (resolvedStatus === LearningStatus.NEED_REVIEW) {
      needReview = true;
    }

    if (hasPassedQuiz && resolvedStatus === LearningStatus.NEED_REVIEW) {
      resolvedStatus = LearningStatus.COMPLETED;
      needReview = false;
      percent = 100;
    }

    return learningRepository.updateProgress(userId, topicId, percent, resolvedStatus, needReview);
  },

  getQuestions: (): Promise<Question[]> => quizRepository.getQuestions(),
  getQuestionsByTopic: (topicId: string): Promise<Question[]> => quizRepository.getQuestionsByTopic(topicId),
  addQuestion: (question: Question): Promise<Question> => quizRepository.addQuestion(question),
  updateQuestion: (id: string, updates: Partial<Question>): Promise<Question> => quizRepository.updateQuestion(id, updates),
  getQuizAttempts: (): Promise<QuizAttempt[]> => quizRepository.getQuizAttempts(),
  getQuizAttemptsForUser: (userId: string): Promise<QuizAttempt[]> => quizRepository.getQuizAttemptsForUser(userId),
  getQuizAttemptById: (id: string): Promise<QuizAttempt | null> => quizRepository.getQuizAttemptById(id),
  addQuizAttempt: (attempt: QuizAttempt): Promise<QuizAttempt> => quizRepository.addQuizAttempt(attempt),

  getExams: (): Promise<Exam[]> => examRepository.getExams(),
  async getExamById(id: string): Promise<Exam | undefined> {
    return (await examRepository.getExamById(id)) || undefined;
  },
  addExam: (exam: Exam): Promise<Exam> => examRepository.addExam(exam),
  updateExam: (id: string, updates: Partial<Exam>): Promise<Exam> => examRepository.updateExam(id, updates),
  getExamAttempts: (): Promise<ExamAttempt[]> => examRepository.getExamAttempts(),
  getExamAttemptsForUser: (userId: string): Promise<ExamAttempt[]> => examRepository.getExamAttemptsForUser(userId),
  getExamAttemptById: (id: string): Promise<ExamAttempt | null> => examRepository.getExamAttemptById(id),
  addExamAttempt: (attempt: ExamAttempt): Promise<ExamAttempt> => examRepository.addExamAttempt(attempt),
  getExamAnswers: (): Promise<ExamAnswer[]> => examRepository.getExamAnswers(),
  addExamAnswers: (answers: ExamAnswer[]): Promise<ExamAnswer[]> => examRepository.addExamAnswers(answers),

  getNews: (): Promise<News[]> => newsRepository.getNews(),
  async getNewsById(id: string): Promise<News | undefined> {
    return (await newsRepository.getNewsById(id)) || undefined;
  },
  addNews: (item: News): Promise<News> => newsRepository.addNews(item),
  updateNews: (id: string, updates: Partial<News>): Promise<News> => newsRepository.updateNews(id, updates),
  deleteNews: (id: string): Promise<void> => newsRepository.deleteNews(id),

  getNotifications: (): Promise<Notification[]> => notificationRepository.getNotifications(),
  getNotificationsForUser: (userId: string): Promise<Notification[]> =>
    notificationRepository.getNotificationsForUser(userId),
  addNotification: (notification: Notification): Promise<Notification> =>
    notificationRepository.addNotification(notification),
  markNotificationRead: (id: string, userId: string): Promise<Notification> =>
    notificationRepository.markNotificationRead(id, userId),

  getChatHistory: (userId: string): Promise<AIChatMessage[]> => aiRepository.getChatHistory(userId),
  addChatMessage: (message: AIChatMessage): Promise<AIChatMessage> => aiRepository.addChatMessage(message),

  getReportSnapshots: (): Promise<ReportSnapshot[]> => reportRepository.getReportSnapshots(),
  addReportSnapshot: (snapshot: ReportSnapshot): Promise<ReportSnapshot> => reportRepository.addReportSnapshot(snapshot),
  getAuditLogs: (): Promise<AuditLog[]> => auditRepository.getAuditLogs(),
  addAuditLog: (log: Omit<AuditLog, "id" | "createdAt">): Promise<AuditLog> => auditRepository.addAuditLog(log)
};
