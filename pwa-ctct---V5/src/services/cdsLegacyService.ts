import {
  Exam,
  ExamAttempt,
  LearningProgress,
  LearningTopic,
  News,
  Question,
  QuestionType,
  User,
  AuditLog
} from "../types";
import {
  CDS_LEGACY_TOPIC_ID,
  legacyAuditLogs,
  legacyExamAttempts,
  legacyExams,
  legacyNews,
  legacyPolicyDocs,
  legacyProgress,
  legacyQuestions,
  legacyQuizAttempts,
  legacyRankingEntries,
  legacyReviewData,
  legacySections,
  legacyTopics,
  legacyUsers
} from "../data/cdsLegacyData";
import { RankingEntry } from "./reportService";

type CdsQuestionRow = {
  question?: string;
  options?: string[] | Record<string, string>;
  answer?: string | number;
};

const apiUrl = (key: string) => (import.meta as any).env?.[key] || "";
const defaultLegacyApi = () =>
  apiUrl("VITE_LEGACY_CDS_API_URL") ||
  apiUrl("VITE_LEGACY_AUTH_API_URL") ||
  apiUrl("VITE_LEGACY_NEWS_API_URL") ||
  "";

const safeFetchJson = async <T>(url: string, init?: RequestInit): Promise<T | null> => {
  if (!url) return null;
  try {
    const response = await fetch(url, init);
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
};

const callLegacyAction = async <T>(action: string, payload: Record<string, unknown> = {}, baseUrl = defaultLegacyApi()): Promise<T | null> => {
  if (!baseUrl) return null;
  const body = new URLSearchParams();
  body.set("action", action);
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) body.set(key, String(value));
  });

  const result = await safeFetchJson<any>(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: body.toString()
  });

  if (!result) return null;
  if (Array.isArray(result)) return result as T;
  if (result.data) return result.data as T;
  if (result.items) return result.items as T;
  if (result.ok === false || result.success === false) return null;
  return result as T;
};

const normalizeOptions = (options: CdsQuestionRow["options"]): string[] => {
  if (Array.isArray(options)) return options;
  if (options && typeof options === "object") {
    return ["A", "B", "C", "D"].map(key => options[key]).filter(Boolean);
  }
  return [];
};

const answerToIndex = (answer: CdsQuestionRow["answer"], options: string[]) => {
  if (typeof answer === "number") return answer;
  if (!answer) return 0;
  const normalized = String(answer).trim();
  if (/^[A-D]$/i.test(normalized)) return normalized.toUpperCase().charCodeAt(0) - 65;
  const exact = options.findIndex(option => option === normalized);
  return exact >= 0 ? exact : 0;
};

const mapCdsQuestion = (row: CdsQuestionRow, index: number): Question => {
  const options = normalizeOptions(row.options);
  const correctIndex = answerToIndex(row.answer, options);
  return {
    id: `cds_static_q_${String(index + 1).padStart(3, "0")}`,
    topicId: CDS_LEGACY_TOPIC_ID,
    type: QuestionType.SINGLE,
    questionText: row.question || `Câu hỏi CDS ${index + 1}`,
    options: options.length ? options : ["A", "B", "C", "D"],
    correctAnswers: [correctIndex],
    explanation: "Dữ liệu kế thừa từ CDS. Bản Netlify static hiển thị giải thích an toàn; giải thích chi tiết có thể bổ sung từ nguồn chính thức ở giai đoạn biên tập nội dung.",
    difficulty: "Trung bình" as Question["difficulty"],
    reference: "public/data/questions.json",
    tags: ["CDS", "Ôn trắc nghiệm", "Kiểm tra nhận thức"]
  };
};

const mapNewsRows = (rows: any[]): News[] =>
  rows
    .filter(Boolean)
    .map((row, index) => ({
      id: String(row.id || row.ID || row.slug || `legacy_news_${index}`),
      title: String(row.title || row.tieuDe || row.name || "Tin tức"),
      category: String(row.category || row.type || row.chuyenMuc || "Tin tức"),
      summary: String(row.summary || row.description || row.moTa || row.content || ""),
      content: String(row.content || row.noiDung || row.summary || row.description || ""),
      imageUrl: row.imageUrl || row.image || row.thumbnail || undefined,
      visibility: "public",
      status: "published",
      authorId: "legacy_apps_script",
      publishedAt: row.publishedAt || row.date || row.createdAt || new Date().toISOString(),
      createdAt: row.createdAt || row.date || new Date().toISOString()
    }));

export const cdsLegacyService = {
  async getNews(): Promise<News[]> {
    const rows = await callLegacyAction<any[]>("listNews", {}, apiUrl("VITE_LEGACY_NEWS_API_URL") || defaultLegacyApi());
    const mapped = Array.isArray(rows) ? mapNewsRows(rows) : [];
    return mapped.length ? mapped : legacyNews;
  },

  async getLegalNews(): Promise<News[]> {
    const news = await this.getNews();
    return news.filter(item =>
      ["Phổ biến giáo dục pháp luật", "Chính sách mới", "Tra cứu văn bản chính sách"].includes(item.category)
    );
  },

  async searchPolicyDocs(query = "") {
    const rows = await callLegacyAction<any[]>("searchPolicyDocs", { q: query }, apiUrl("VITE_LEGACY_POLICY_API_URL") || defaultLegacyApi());
    const source = Array.isArray(rows) && rows.length ? rows : legacyPolicyDocs;
    const needle = query.trim().toLowerCase();
    return needle
      ? source.filter(item => `${item.title} ${item.summary} ${item.category}`.toLowerCase().includes(needle))
      : source;
  },

  async getMaterials(): Promise<LearningTopic[]> {
    const rows = await callLegacyAction<any[]>("materials", {}, apiUrl("VITE_LEGACY_MATERIALS_API_URL") || defaultLegacyApi());
    if (!Array.isArray(rows) || rows.length === 0) return legacyTopics;

    return rows.map((row, index) => ({
      ...legacyTopics[0],
      id: String(row.id || row.ID || `cds_material_${index}`),
      title: String(row.title || row.name || row.ten || legacyTopics[0].title),
      description: String(row.description || row.summary || row.moTa || legacyTopics[0].description),
      content: String(row.content || row.noiDung || row.description || legacyTopics[0].content),
      references: [row.url || row.link || "Legacy CDS materials API"].filter(Boolean),
      createdAt: row.createdAt || legacyTopics[0].createdAt,
      updatedAt: row.updatedAt || legacyTopics[0].updatedAt
    }));
  },

  async getQuestions(): Promise<Question[]> {
    const staticRows = await safeFetchJson<CdsQuestionRow[]>("/data/questions.json");
    if (Array.isArray(staticRows) && staticRows.length) {
      return staticRows.map(mapCdsQuestion);
    }
    return legacyQuestions;
  },

  async getPracticeSets() {
    const questions = await this.getQuestions();
    return [
      { id: "cds_practice", title: "Ôn trắc nghiệm", questionCount: questions.length, target: "quiz" },
      { id: "cds_try_exam", title: "Thi thử", questionCount: questions.length, target: "quiz" },
      { id: "cds_official", title: "Kiểm tra nhận thức", questionCount: questions.length, target: "exams" }
    ];
  },

  async getTryExam(): Promise<Exam> {
    return { ...legacyExams[0], id: "cds_try_exam", title: "Thi thử nhận thức chính trị - pháp luật" };
  },

  async getOfficialExam(): Promise<Exam> {
    return legacyExams[0];
  },

  async getMyResults(): Promise<ExamAttempt[]> {
    return legacyExamAttempts;
  },

  async getTryResults() {
    return legacyQuizAttempts;
  },

  async getLeaderboard(): Promise<RankingEntry[]> {
    return legacyRankingEntries;
  },

  async getReviewData() {
    return legacyReviewData;
  },

  async getAdminUsers(): Promise<User[]> {
    const rows = await callLegacyAction<User[]>("admin_list_users", {}, apiUrl("VITE_LEGACY_AUTH_API_URL") || defaultLegacyApi());
    return Array.isArray(rows) && rows.length ? rows : legacyUsers;
  },

  async getAdminAudit(): Promise<AuditLog[]> {
    const rows = await callLegacyAction<AuditLog[]>("admin_list_audit", {}, apiUrl("VITE_LEGACY_AUTH_API_URL") || defaultLegacyApi());
    return Array.isArray(rows) && rows.length ? rows : legacyAuditLogs;
  },

  getSections() {
    return legacySections;
  },

  getProgress(): LearningProgress[] {
    return legacyProgress;
  },

  getQuizHistory() {
    return legacyQuizAttempts;
  },

  getExamHistory() {
    return legacyExamAttempts;
  }
};

export default cdsLegacyService;
