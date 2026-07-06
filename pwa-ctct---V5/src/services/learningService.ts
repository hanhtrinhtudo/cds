import { apiClient } from "./apiClient";
import { LearningTopic, LearningProgress, LearningAssignment, LearningStatus, TopicCategory } from "../types";
import { isLegacyAppsScriptAuthMode } from "./authService";
import { cdsLegacyService } from "./cdsLegacyService";

type LegacyMaterialRow = Record<string, any>;
type LegacyMaterialQuizRow = Record<string, any>;

export interface MaterialQuizQuestion {
  id: string;
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
  topic?: string;
}

let fallbackUsed = false;

const env = (key: string): string => String((import.meta as any).env?.[key] || "").trim();
const learningApiUrl = () => env("VITE_LEARNING_API_URL") || env("VITE_MATERIALS_API_URL") || env("VITE_LEGACY_CDS_API_URL");

const legacyLearningAction = async <T>(action: string, payload: Record<string, unknown> = {}): Promise<T> => {
  const base = learningApiUrl();
  if (!base) throw new Error("Thiếu VITE_LEARNING_API_URL cho chế độ học tập CDS.");

  const url = new URL(base);
  url.searchParams.set("action", action);
  url.searchParams.set("payload", JSON.stringify(payload));

  const request = url.toString().length > 1800
    ? fetch(base, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: JSON.stringify({ action, payload }),
        cache: "no-store"
      })
    : fetch(url.toString(), { method: "GET", cache: "no-store" });

  const response = await request;
  if (!response.ok) throw new Error(`Hoctap Apps Script trả về HTTP ${response.status}`);
  const json = await response.json();
  if (json?.ok === false || json?.success === false) throw new Error(json.error || json.message || `Hoctap action ${action} thất bại`);
  return (json?.data ?? json) as T;
};

const cleanTitle = (value: unknown) => String(value || "Tài liệu học tập").replace(/\.(pdf|docx?|pptx?|xlsx?)$/i, "").trim();
const drivePreviewUrl = (fileId: string) => fileId ? `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/preview` : "";
const driveOpenUrl = (fileId: string) => fileId ? `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/view` : "";

const categoryFromMaterial = (row: LegacyMaterialRow): TopicCategory => {
  const text = `${row["chu-de"] || ""} ${row.category || ""} ${row.type || ""}`.toLocaleLowerCase("vi");
  if (text.includes("pháp") || text.includes("luật") || text.includes("chính sách")) return TopicCategory.LEGAL;
  if (text.includes("đảng")) return TopicCategory.PARTY_WORK;
  if (text.includes("thời sự")) return TopicCategory.CURRENT_AFFAIRS;
  return TopicCategory.POLITICAL;
};

const materialFileId = (row: LegacyMaterialRow, index: number) => String(row.fileId || row.fileID || row.id || row.ID || `cds_material_${index}`);
const fileIdFromTopicId = (topicId: string) => topicId.replace(/^cds_material_/, "");

const mapMaterialToTopic = (row: LegacyMaterialRow, index: number, hasQuiz = false): LearningTopic => {
  const fileId = materialFileId(row, index);
  const title = cleanTitle(row["tieu-de"] || row.title || row.name || row.ten);
  const topicLabel = String(row["chu-de"] || row.topic || row.category || "Tài liệu học tập").trim();
  const description = String(row.description || row.summary || row.moTa || topicLabel || "Tài liệu học tập kế thừa từ CDS.");
  const preview = drivePreviewUrl(fileId);
  const open = driveOpenUrl(fileId);
  return {
    id: `cds_material_${fileId}`,
    title,
    category: categoryFromMaterial(row),
    description,
    objective: `Nghiên cứu tài liệu: ${title}`,
    content: [
      description,
      "",
      "Nguồn: CDS Hoctap / Google Drive.",
      open ? `Liên kết tài liệu: ${open}` : ""
    ].filter(Boolean).join("\n"),
    contentType: "pdf",
    estimatedMinutes: Number(row.estimatedMinutes || row.minutes || 20),
    required: true,
    difficulty: "Trung bình",
    tags: [topicLabel, "CDS", "Tài liệu học tập", hasQuiz ? "Có câu hỏi ôn tập" : "Chưa xác nhận câu hỏi"].filter(Boolean),
    references: [open || "CDS Hoctap", row.thumbnail].filter(Boolean),
    createdBy: "legacy_apps_script",
    createdAt: String(row.createdAt || row.created || new Date().toISOString()),
    updatedAt: String(row.updatedAt || row.updated || new Date().toISOString()),
    pdfUrl: preview || undefined,
    videoUrl: row.thumbnail || undefined,
    assignedUnitIds: [],
    assignedUserIds: []
  };
};

const quizHasQuestions = async (fileId: string): Promise<boolean> => {
  if (!fileId) return false;
  try {
    const payload = await legacyLearningAction<{ count?: number }>("quiz.has", { fileId });
    return Number(payload?.count || 0) > 0;
  } catch {
    return false;
  }
};

const normalizeQuizOptions = (row: LegacyMaterialQuizRow): string[] => {
  const value = row.options || row.opts || row.choices;
  if (Array.isArray(value)) return value.map(item => String(item));
  if (value && typeof value === "object") return ["A", "B", "C", "D"].map(key => value[key]).filter(Boolean).map(String);
  return ["A", "B", "C", "D"].map(key => row[key] || row[key.toLowerCase()]).filter(Boolean).map(String);
};

const normalizeAnswer = (answer: unknown, options: string[]): string => {
  const raw = String(answer ?? "").trim();
  if (/^[A-D]$/i.test(raw)) {
    const index = raw.toUpperCase().charCodeAt(0) - 65;
    return options[index] || raw.toUpperCase();
  }
  const numeric = Number(raw);
  if (Number.isFinite(numeric) && options[numeric]) return options[numeric];
  if (Number.isFinite(numeric) && options[numeric - 1]) return options[numeric - 1];
  return raw;
};

const mapQuizRow = (row: LegacyMaterialQuizRow, index: number, fileId: string): MaterialQuizQuestion => {
  const options = normalizeQuizOptions(row);
  return {
    id: String(row.id || row.qid || row.no || `${fileId}_quiz_${index + 1}`),
    question: String(row.q || row.question || row.text || row["cau-hoi"] || `Câu hỏi ${index + 1}`),
    options,
    answer: normalizeAnswer(row.answer ?? row.correct ?? row.dapAn, options),
    explanation: String(row.explanation || row.giaiThich || row["giai-thich"] || ""),
    topic: String(row.topic || row.chuDe || row["chu-de"] || "")
  };
};

const getLegacyLearningTopics = async (): Promise<LearningTopic[]> => {
  try {
    const payload = await legacyLearningAction<{ items?: LegacyMaterialRow[] }>("tailieu.danh-sach", { "tu-khoa": "" });
    const rows = Array.isArray(payload?.items) ? payload.items : [];
    if (!rows.length) throw new Error("Hoctap không trả về tài liệu.");
    fallbackUsed = false;
    // Resolve quiz availability lazily when a material is opened. Probing every
    // row here delayed first render with one extra Apps Script call per item.
    return rows.map((row, index) => mapMaterialToTopic(row, index));
  } catch (error) {
    console.warn("[learningService] Dùng dữ liệu học tập dự phòng:", error instanceof Error ? error.message : error);
    fallbackUsed = true;
    return cdsLegacyService.getMaterials();
  }
};

const getLegacySections = async (topic: LearningTopic): Promise<any[]> => {
  const fileId = fileIdFromTopicId(topic.id);
  if (!fileId || fileId === topic.id) return cdsLegacyService.getSections().filter(section => section.topicId === topic.id);
  try {
    const payload = await legacyLearningAction<{ items?: any[] }>("materials.sections", { fileId });
    const rows = Array.isArray(payload?.items) ? payload.items : [];
    return rows.map((row, index) => ({
      id: String(row.id || row.key || `${topic.id}_section_${index + 1}`),
      topicId: topic.id,
      title: String(row.title || row.heading || row.name || `Mục ${index + 1}`),
      content: String(row.content || row.text || row.summary || row.html || ""),
      order: Number(row.order || index + 1),
      required: true
    }));
  } catch {
    return [];
  }
};

export const learningService = {
  wasFallbackUsed(): boolean {
    return fallbackUsed;
  },

  async getTopics(): Promise<LearningTopic[]> {
    if (isLegacyAppsScriptAuthMode()) return getLegacyLearningTopics();
    return apiClient.get<LearningTopic[]>("/api/learning/topics");
  },

  async hasMaterialQuiz(topicId: string): Promise<boolean> {
    if (!isLegacyAppsScriptAuthMode()) return false;
    return quizHasQuestions(fileIdFromTopicId(topicId));
  },

  async getMaterialQuiz(topicId: string, limit = 10): Promise<MaterialQuizQuestion[]> {
    if (!isLegacyAppsScriptAuthMode()) return [];
    const fileId = fileIdFromTopicId(topicId);
    if (!fileId || fileId === topicId) return [];
    const payload = await legacyLearningAction<{ items?: LegacyMaterialQuizRow[] }>("quiz.getByFile", { fileId, limit });
    const rows = Array.isArray(payload?.items) ? payload.items : [];
    return rows.map((row, index) => mapQuizRow(row, index, fileId)).filter(item => item.question && item.options.length);
  },

  async getMaterialSummary(topicId: string): Promise<string> {
    if (!isLegacyAppsScriptAuthMode()) return "";
    const fileId = fileIdFromTopicId(topicId);
    if (!fileId || fileId === topicId) return "";
    const payload = await legacyLearningAction<any>("ai.tom-tat", { fileId });
    return String(payload?.summary || payload?.tomtat || payload?.answer || payload?.text || "").trim();
  },

  async getTopicById(id: string): Promise<LearningTopic & { sections: any[]; progress: LearningProgress | null }> {
    if (isLegacyAppsScriptAuthMode()) {
      const topics = await getLegacyLearningTopics();
      const topic = topics.find(t => t.id === id) || topics[0];
      const sections = topic ? await getLegacySections(topic) : [];
      const sectionText = sections
        .filter(section => section.content)
        .map(section => `${section.title}\n${section.content}`)
        .join("\n\n");
      const progress = cdsLegacyService.getProgress().find(p => p.topicId === topic.id) || null;
      return { ...topic, content: sectionText ? `${topic.content}\n\n${sectionText}` : topic.content, sections, progress };
    }
    return apiClient.get<LearningTopic & { sections: any[]; progress: LearningProgress | null }>(`/api/learning/topics/${id}`);
  },

  async createTopic(data: Partial<LearningTopic>): Promise<LearningTopic> {
    return apiClient.post<LearningTopic>("/api/learning/topics", data);
  },

  async updateTopic(id: string, data: Partial<LearningTopic>): Promise<LearningTopic> {
    return apiClient.patch<LearningTopic>(`/api/learning/topics/${id}`, data);
  },

  async assignTopic(id: string, assignment: { assignedUnitIds: string[]; assignedUserIds?: string[]; deadline?: string; required?: boolean }): Promise<{ message: string; topic: LearningTopic }> {
    return apiClient.post<{ message: string; topic: LearningTopic }>(`/api/learning/topics/${id}/assign`, assignment);
  },

  async getMyAssignments(): Promise<LearningAssignment[]> {
    if (isLegacyAppsScriptAuthMode()) return [];
    return apiClient.get<LearningAssignment[]>("/api/learning/my-assignments");
  },

  async startProgress(topicId: string): Promise<LearningProgress> {
    if (isLegacyAppsScriptAuthMode()) {
      return {
        id: `legacy_progress_${topicId}`,
        userId: "legacy_user",
        topicId,
        status: LearningStatus.IN_PROGRESS,
        progressPercent: 10,
        startedAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString(),
        needReview: false
      };
    }
    return apiClient.post<LearningProgress>("/api/learning/progress/start", { topicId });
  },

  async updateProgress(topicId: string, progressPercent: number, status: LearningStatus, needReview = false): Promise<LearningProgress> {
    if (isLegacyAppsScriptAuthMode()) {
      return {
        id: `legacy_progress_${topicId}`,
        userId: "legacy_user",
        topicId,
        status,
        progressPercent,
        startedAt: new Date().toISOString(),
        completedAt: status === LearningStatus.COMPLETED ? new Date().toISOString() : undefined,
        lastAccessedAt: new Date().toISOString(),
        needReview
      };
    }
    return apiClient.post<LearningProgress>("/api/learning/progress/update", { topicId, progressPercent, status, needReview });
  },

  async completeProgress(topicId: string): Promise<LearningProgress> {
    return apiClient.post<LearningProgress>("/api/learning/progress/complete", { topicId });
  }
};
export default learningService;
