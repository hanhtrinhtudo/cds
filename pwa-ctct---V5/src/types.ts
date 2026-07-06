export enum UserRole {
  GUEST = "guest",
  MEMBER = "member",
  INSTRUCTOR = "instructor",
  POLITICAL_OFFICER = "political_officer",
  ADMIN = "admin",
}

export enum AccountStatus {
  PENDING = "pending",
  ACTIVE = "active",
  SUSPENDED = "suspended",
  REJECTED = "rejected",
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatar: string;
  unitId: string;
  role: UserRole;
  accountStatus: AccountStatus;
  mustChangePassword?: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}

export interface UserAuthRecord extends User {
  passwordHash: string;
}

export interface Unit {
  id: string;
  name: string;
  type: string;
  parentUnitId?: string;
  description: string;
}

export enum TopicCategory {
  POLITICAL = "Giáo dục chính trị",
  LEGAL = "Phổ biến giáo dục pháp luật",
  MILITARY_DISCIPLINE = "Kỷ luật Quân đội",
  PARTY_WORK = "Công tác Đảng, công tác chính trị",
  CURRENT_AFFAIRS = "Thời sự chính trị",
  REGULATIONS = "Quy định điều lệnh",
  PUBLIC_LEGAL = "Pháp luật đại chúng"
}

export enum LearningStatus {
  NOT_STARTED = "not_started",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  NEED_REVIEW = "need_review",
}

export interface LearningTopic {
  id: string;
  title: string;
  category: TopicCategory;
  description: string;
  objective: string;
  content: string; // Detail reading content or scenario explanation
  contentType: "document" | "video" | "pdf" | "slide";
  estimatedMinutes: number;
  required: boolean;
  deadline?: string;
  status?: LearningStatus;
  difficulty: "Dễ" | "Trung bình" | "Khó";
  tags: string[];
  references: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  videoUrl?: string; // placeholder text or video id
  pdfUrl?: string; // placeholder text or doc id
  assignedUnitIds?: string[];
  assignedUserIds?: string[];
}

export interface LearningProgress {
  id: string;
  userId: string;
  topicId: string;
  status: LearningStatus;
  progressPercent: number;
  startedAt: string;
  completedAt?: string;
  lastAccessedAt: string;
  needReview: boolean;
  scoreImpact?: number;
}

export enum QuestionType {
  SINGLE = "single",
  MULTIPLE = "multiple",
  TRUE_FALSE = "true_false",
  SCENARIO = "scenario",
}

export interface Question {
  id: string;
  topicId: string;
  type: QuestionType;
  questionText: string;
  options: string[];
  correctAnswers: number[]; // Index of correct option(s)
  explanation: string;
  difficulty: "Dễ" | "Trung bình" | "Khó";
  reference: string;
  tags: string[];
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizType: "topic" | "random" | "weak";
  topicId?: string;
  startedAt: string;
  submittedAt?: string;
  score: number; // 0 to 10
  correctCount: number;
  wrongCount: number;
  totalQuestions: number;
  answers: { [questionId: string]: number[] }; // Key questionId, value array of chosen option indexes
  status: "in_progress" | "submitted";
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  topicIds: string[];
  durationMinutes: number;
  questionCount: number;
  startDate: string;
  endDate: string;
  passingScore: number; // e.g., 5.0 or 7.0 or 8.0 (scale of 10)
  allowReview: boolean;
  status: "active" | "inactive" | "expired";
  lifecycleStatus?: "draft" | "scheduled" | "published" | "archived";
  createdBy: string;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  userId: string;
  startedAt: string;
  submittedAt?: string;
  score: number; // 0 to 10
  correctCount: number;
  wrongCount: number;
  passed: boolean;
  status: "in_progress" | "submitted" | "graded" | "reviewed" | "expired";
  answers: { [questionId: string]: number[] };
}

export interface News {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  imageUrl?: string;
  source?: string;
  externalUrl?: string;
  visibility: "public" | "internal";
  status: "draft" | "published";
  authorId: string;
  publishedAt: string;
  createdAt: string;
}

export interface AIChatMessage {
  id: string;
  userId: string;
  topicId?: string;
  role: "user" | "model";
  content: string;
  createdAt: string;
  safetyLevel?: string;
  referenceUsed?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "exam";
  read: boolean;
  createdAt: string;
}

export interface LearningSection {
  id: string;
  topicId: string;
  title: string;
  content: string;
  order: number;
  required: boolean;
}

export interface LearningAssignment {
  id: string;
  topicId: string;
  assignedToUserId?: string;
  assignedToUnitId?: string;
  assignedBy: string;
  required: boolean;
  deadline?: string;
  status: "pending" | "completed" | "overdue";
  createdAt: string;
}

export interface ExamAnswer {
  id: string;
  examAttemptId: string;
  questionId: string;
  selectedAnswers: number[];
  isCorrect: boolean;
  answeredAt: string;
}

export interface ReportSnapshot {
  id: string;
  title: string;
  type: "personal" | "instructor" | "unit" | "admin";
  generatedBy: string;
  data: any;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: any;
  createdAt: string;
}
