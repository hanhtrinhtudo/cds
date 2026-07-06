import { apiClient } from "./apiClient";
import { Exam, ExamAttempt, Question, QuestionType } from "../types";
import { isLegacyAppsScriptAuthMode } from "./authService";
import { cdsLegacyService } from "./cdsLegacyService";

export interface ExamTarget {
  key: string;
  label: string;
  questionCount?: number;
}

export interface ExamBank {
  bankId: string;
  title: string;
  folderId: string;
  mode: "mock" | "exam" | string;
  status: "open" | "upcoming" | "closed" | string;
  statusLabel: string;
  startAt: string;
  endAt: string;
  startAtLocal: string;
  endAtLocal: string;
  durationSec: number;
  totalOverride: number;
  questionCount: number;
  targets: Array<string | ExamTarget>;
  apiSource: "official" | "mock";
  mockFileId?: string;
  mockFileType?: string;
}

export interface ExamWithBank extends Exam {
  bankId: string;
  bankMode: "mock" | "exam" | string;
  bankStatus: string;
  statusLabel: string;
  startAtLocal: string;
  endAtLocal: string;
  durationSec: number;
  targets: ExamTarget[];
  folderId?: string;
  apiSource: "official" | "mock";
}

export interface LegacyExamQuestion {
  id: string | number;
  text: string;
  opts: string[];
  correct: number;
  topic?: string;
}

export interface ExamQuestionsResponse {
  ok: boolean;
  bankId: string;
  title: string;
  durationSec: number;
  total: number;
  target?: string;
  questions: LegacyExamQuestion[];
}

export interface ExamAnswerPayload {
  no: number;
  qid: string | number;
  qtext: string;
  opts: string[];
  chosen: number;
  chosenText: string;
  correctIndex: number;
  correctText: string;
  ok: boolean;
  topic?: string;
}

export interface SubmitExamPayload {
  action: "submit";
  bankId: string;
  userId: string;
  username: string;
  userName: string;
  userUnit: string;
  correct: number;
  wrong: number;
  skip: number;
  total: number;
  spentSec: number;
  device: string;
  userAgent: string;
  answers: ExamAnswerPayload[];
  extra: Record<string, unknown>;
}

export interface SubmitExamResponse {
  ok: boolean;
  attemptId: string;
  ts: string;
  pct: number;
  [key: string]: unknown;
}

export interface ResultSummaryParams {
  bank?: string;
  user?: string;
  unit?: string;
  apiSource?: "official" | "mock";
}

export interface LeaderboardParams {
  bank?: string;
  scope: "user" | "unit";
  limit?: number;
  bestOf?: string;
  apiSource?: "official" | "mock";
}

export interface LeaderboardResponse {
  ok: boolean;
  scope: "user" | "unit";
  bank: string;
  bestOf?: string;
  items: any[];
  [key: string]: unknown;
}

let fallbackUsed = false;
let mockApiError = false;
const mockBankRegistry = new Map<string, ExamBank>();

const env = (key: string) => String((import.meta as any).env?.[key] || "").trim();
export const getOfficialExamApiUrl = () => env("VITE_EXAM_API_URL") || env("VITE_LEGACY_CDS_API_URL");
export const getMockExamApiUrl = () => env("VITE_MOCK_EXAM_API_URL") || env("VITE_TRY_EXAM_API_URL") || getOfficialExamApiUrl();

const actionUrl = (action: string, params: Record<string, unknown> = {}, apiSource: "official" | "mock" = "official") => {
  const base = apiSource === "mock" ? getMockExamApiUrl() : getOfficialExamApiUrl();
  if (!base) throw new Error(apiSource === "mock" ? "VITE_MOCK_EXAM_API_URL chưa được cấu hình" : "VITE_EXAM_API_URL chưa được cấu hình");
  const url = new URL(base);
  url.searchParams.set("action", action);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value) !== "") url.searchParams.set(key, String(value));
  });
  const finalUrl = url.toString();
  if ((import.meta as any).env?.DEV) {
    console.debug(`[examService] ${apiSource}:${action} request URL:`, finalUrl);
  }
  return finalUrl;
};

const getJson = async <T>(action: string, params: Record<string, unknown> = {}, apiSource: "official" | "mock" = "official"): Promise<T> => {
  const response = await fetch(actionUrl(action, params, apiSource), { method: "GET", cache: "no-store" });
  if (!response.ok) throw new Error(`Exam Apps Script trả về HTTP ${response.status}`);
  const payload = await response.json() as T & { ok?: boolean; error?: string };
  if (payload?.ok === false) throw new Error(payload.error || `Exam action ${action} thất bại`);
  return payload;
};

const getText = async (action: string, params: Record<string, unknown>, apiSource: "official" | "mock") => {
  const response = await fetch(actionUrl(action, params, apiSource), { method: "GET", cache: "no-store" });
  if (!response.ok) throw new Error(`Exam Apps Script trả về HTTP ${response.status}`);
  return response.text();
};

const normalizeTargets = (value: unknown): ExamTarget[] => {
  if (Array.isArray(value)) return value.map(item => {
    if (item && typeof item === "object") {
      const row = item as Record<string, unknown>;
      return { key: String(row.key || row.id || row.value || ""), label: String(row.label || row.name || row.key || ""), questionCount: row.questionCount === undefined ? undefined : Number(row.questionCount) };
    }
    return { key: String(item), label: String(item) };
  }).filter(item => item.key);
  if (typeof value === "string") return value.split(/[,;|]/).map(item => item.trim()).filter(Boolean).map(item => ({ key: item, label: item }));
  return [];
};

const mockFolders = () => [
  { key: "DQTV", label: "Dân quân tự vệ", folderId: env("VITE_BANK_DQTV") },
  { key: "LLTT", label: "Lực lượng thường trực", folderId: env("VITE_BANK_LLTT") }
].filter(item => item.folderId);

export const normalizeMockBanks = (
  payload: unknown,
  target: { key: string; label: string; folderId: string }
): ExamBank[] => {
  const source = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const rows = Array.isArray(source.banks) ? source.banks : Array.isArray(source.items) ? source.items : [];
  return rows.map((item, index) => {
    const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
    const fileId = String(row.id || row.fileId || row.bankId || "");
    const title = String(row.title || row.name || `Ngân hàng thi thử ${target.label}`);
    const bank: ExamBank = {
      bankId: `mock_${target.key}_${fileId || index + 1}`,
      title: `Thi thử ${target.label} — ${title}`,
      folderId: target.folderId,
      mode: "mock",
      status: "open",
      statusLabel: "SẴN SÀNG",
      startAt: "",
      endAt: "",
      startAtLocal: "Không giới hạn",
      endAtLocal: "Không giới hạn",
      durationSec: 30 * 60,
      totalOverride: 50,
      questionCount: 50,
      targets: [{ key: target.key, label: target.label, questionCount: 50 }],
      apiSource: "mock",
      mockFileId: fileId,
      mockFileType: String(row.type || row.mimeType || "")
    };
    mockBankRegistry.set(bank.bankId, bank);
    return bank;
  }).filter(bank => Boolean(bank.mockFileId));
};

export const normalizeMockQuestions = (
  payload: unknown,
  bank: ExamBank,
  target?: string
): ExamQuestionsResponse => {
  const source = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const rows = Array.isArray(source.questions) ? source.questions : Array.isArray(payload) ? payload : [];
  const letters = ["A", "B", "C", "D"];
  const questions: LegacyExamQuestion[] = rows.map((item, index) => {
    const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
    const optionSource = row.options;
    const opts = Array.isArray(optionSource)
      ? optionSource.map(String)
      : letters.map(letter => String(optionSource && typeof optionSource === "object" ? (optionSource as Record<string, unknown>)[letter] || "" : "")).filter(Boolean);
    const rawAnswer = row.answer ?? row.correct ?? -1;
    const correct = typeof rawAnswer === "string" && letters.includes(rawAnswer.toUpperCase())
      ? letters.indexOf(rawAnswer.toUpperCase())
      : Number(rawAnswer);
    return {
      id: String(row.id || `${bank.bankId}_${index + 1}`),
      text: String(row.question || row.text || ""),
      opts,
      correct,
      topic: String(row.topic || target || "Thi thử")
    };
  }).filter(question => question.text && question.opts.length);
  return {
    ok: questions.length > 0,
    bankId: bank.bankId,
    title: bank.title,
    durationSec: bank.durationSec,
    total: questions.length,
    target,
    questions
  };
};

export const normalizeMockSubmitResponse = (payload: unknown, request: SubmitExamPayload): SubmitExamResponse => {
  const source = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const pct = request.total ? Math.round((request.correct / request.total) * 100) : 0;
  return {
    ...source,
    ok: source.ok !== false,
    attemptId: String(source.attemptId || `mock_${Date.now()}`),
    ts: String(source.ts || source.timestamp || new Date().toISOString()),
    pct: Number(source.pct ?? source.percent ?? pct),
    apiSource: "mock"
  };
};

export const normalizeMockResults = (payload: unknown) => {
  const source = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const rows = Array.isArray(source.rows) ? source.rows : Array.isArray(source.items) ? source.items : Array.isArray(source.results) ? source.results : [];
  return { ok: true, items: rows, apiSource: "mock", sourceAction: "myResults" };
};

export const normalizeMockLeaderboard = (payload: unknown, params: LeaderboardParams): LeaderboardResponse => {
  const source = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const items = Array.isArray(source.items) ? source.items : Array.isArray(source.rows) ? source.rows : [];
  return {
    ...source,
    ok: source.ok !== false,
    scope: params.scope,
    bank: params.bank || "",
    items,
    unsupported: !items.length && source.ok === undefined,
    apiSource: "mock"
  };
};

const fallbackBanks = async (): Promise<ExamBank[]> => {
  const official = await cdsLegacyService.getOfficialExam();
  const toBank = (exam: Exam): ExamBank => ({
    bankId: "fallback_official_bank",
    title: exam.title,
    folderId: "",
    mode: "exam",
    status: exam.status === "active" ? "open" : exam.status === "expired" ? "closed" : "upcoming",
    statusLabel: exam.status === "active" ? "Đang mở" : exam.status === "expired" ? "Đã kết thúc" : "Sắp mở",
    startAt: exam.startDate,
    endAt: exam.endDate,
    startAtLocal: new Date(exam.startDate).toLocaleString("vi-VN"),
    endAtLocal: new Date(exam.endDate).toLocaleString("vi-VN"),
    durationSec: exam.durationMinutes * 60,
    totalOverride: exam.questionCount,
    questionCount: exam.questionCount,
    targets: [],
    apiSource: "official"
  });
  return [toBank(official)];
};

const bankToExam = (bank: ExamBank): ExamWithBank => ({
  id: bank.bankId,
  bankId: bank.bankId,
  title: bank.title,
  description: bank.mode === "mock" ? "Thi thử từ ngân hàng đề CDS trực tuyến" : "Kiểm tra nhận thức chính thức từ ngân hàng đề CDS trực tuyến",
  topicIds: [],
  durationMinutes: Math.max(1, Math.ceil(Number(bank.durationSec || 0) / 60)),
  questionCount: Number(bank.totalOverride || bank.questionCount || 0),
  startDate: bank.startAt || new Date(0).toISOString(),
  endDate: bank.endAt || new Date(8640000000000000).toISOString(),
  passingScore: 5,
  allowReview: true,
  status: bank.status === "open" ? "active" : bank.status === "closed" ? "expired" : "inactive",
  lifecycleStatus: bank.status === "open" ? "published" : "scheduled",
  createdBy: "legacy_apps_script",
  bankMode: bank.mode,
  bankStatus: bank.status,
  statusLabel: bank.statusLabel,
  startAtLocal: bank.startAtLocal,
  endAtLocal: bank.endAtLocal,
  durationSec: Number(bank.durationSec || 0),
  targets: normalizeTargets(bank.targets),
  folderId: bank.folderId,
  apiSource: bank.apiSource
});

const fallbackQuestions = async (bankId: string, target?: string): Promise<ExamQuestionsResponse> => {
  const staticQuestions = await cdsLegacyService.getQuestions();
  return {
    ok: true,
    bankId,
    title: bankId === "fallback_mock_bank" ? "Thi thử dự phòng" : "Kiểm tra nhận thức dự phòng",
    durationSec: 30 * 60,
    total: staticQuestions.length,
    target,
    questions: staticQuestions.map((question, index) => ({
      id: question.id || index + 1,
      text: question.questionText,
      opts: question.options,
      correct: question.correctAnswers[0] ?? 0,
      topic: question.tags?.[0] || question.topicId
    }))
  };
};

export const toUiQuestion = (question: LegacyExamQuestion, bankId: string): Question => ({
  id: String(question.id),
  topicId: bankId,
  type: QuestionType.SINGLE,
  questionText: question.text,
  options: Array.isArray(question.opts) ? question.opts : [],
  correctAnswers: [Number(question.correct)],
  explanation: question.topic ? `Chủ đề: ${question.topic}` : "Đáp án từ ngân hàng câu hỏi CDS.",
  difficulty: "Trung bình",
  reference: `CDS bank: ${bankId}`,
  tags: [question.topic || "CDS exam"]
});

export const examService = {
  async getBanks(): Promise<ExamBank[]> {
    try {
      const payload = await getJson<{ ok: boolean; banks: ExamBank[] }>("listBanks");
      const banks = Array.isArray(payload.banks) ? payload.banks.map(bank => ({ ...bank, apiSource: "official" as const })) : [];
      if (!banks.length) throw new Error("Apps Script không trả về ngân hàng đề");
      fallbackUsed = false;
      return banks;
    } catch (error) {
      console.warn("[examService] Dùng ngân hàng đề dự phòng:", error instanceof Error ? error.message : error);
      fallbackUsed = true;
      return fallbackBanks();
    }
  },

  async getMockExams(): Promise<ExamBank[]> {
    try {
      const folders = mockFolders();
      if (!folders.length) throw new Error("Chưa cấu hình VITE_BANK_DQTV/VITE_BANK_LLTT");
      const payloads = await Promise.all(folders.map(async folder => ({
        folder,
        payload: await getJson<unknown>("listBanks", { folderId: folder.folderId }, "mock")
      })));
      const banks = payloads.flatMap(({ folder, payload }) => normalizeMockBanks(payload, folder));
      if (!banks.length) throw new Error("Apps Script Thi thử không trả về ngân hàng đề");
      mockApiError = false;
      return banks;
    } catch (error) {
      console.warn("[examService] Không tải được dữ liệu Thi thử từ Apps Script:", error instanceof Error ? error.message : error);
      mockApiError = true;
      return [];
    }
  },

  async getOfficialExams(): Promise<ExamBank[]> {
    return (await this.getBanks()).filter(bank => bank.mode === "exam");
  },

  async getMockExamQuestions(bankId: string, target?: string): Promise<ExamQuestionsResponse> {
    let bank = mockBankRegistry.get(bankId);
    if (!bank) {
      await this.getMockExams();
      bank = mockBankRegistry.get(bankId);
    }
    if (!bank?.mockFileId) throw new Error("Không tìm thấy tệp ngân hàng Thi thử");
    const isXlsx = bank.mockFileType === "xlsx" || /spreadsheetml|xlsx/i.test(bank.mockFileType);
    const payload = isXlsx
      ? await getJson<unknown>("questionsXlsx", { fileId: bank.mockFileId, tab: "Câu hỏi" }, "mock")
      : await getJson<unknown>("questions", { sheetId: bank.mockFileId, tab: "Câu hỏi" }, "mock");
    const normalized = normalizeMockQuestions(payload, bank, target || normalizeTargets(bank.targets)[0]?.key);
    if (!normalized.questions.length) throw new Error("Ngân hàng Thi thử không có câu hỏi");
    mockApiError = false;
    return normalized;
  },

  async getExamQuestions(bankId: string, target?: string): Promise<ExamQuestionsResponse> {
    if (bankId.startsWith("fallback_")) {
      fallbackUsed = true;
      return fallbackQuestions(bankId, target);
    }
    try {
      const payload = await getJson<ExamQuestionsResponse>("questions", { bank: bankId, target });
      if (!Array.isArray(payload.questions) || payload.questions.length === 0) throw new Error("Ngân hàng đề không có câu hỏi");
      fallbackUsed = false;
      return payload;
    } catch (error) {
      console.warn("[examService] Dùng câu hỏi dự phòng:", error instanceof Error ? error.message : error);
      fallbackUsed = true;
      return fallbackQuestions(bankId, target);
    }
  },

  async submitExamResult(payload: SubmitExamPayload): Promise<SubmitExamResponse> {
    const isMock = payload.extra?.apiSource === "mock" || payload.extra?.mode === "mock";
    const mockDetails = payload.answers.map(answer => ({
      index: answer.no,
      question: answer.qtext,
      chosen: answer.chosen >= 0 ? String.fromCharCode(65 + answer.chosen) : "",
      correct: answer.correctIndex >= 0 ? String.fromCharCode(65 + answer.correctIndex) : "",
      explanation: ""
    }));
    const requestBody = isMock ? {
      action: "submitResult",
      examCode: payload.bankId,
      name: payload.userName,
      unit: payload.userUnit,
      position: String(payload.extra?.position || ""),
      score: payload.correct,
      total: payload.total,
      details: mockDetails,
      topic: String(payload.extra?.target || ""),
      timestamp: new Date().toISOString()
    } : { ...payload, action: "submit" };
    const response = await fetch(actionUrl(isMock ? "submitResult" : "submit", {}, isMock ? "mock" : "official"), {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(requestBody),
      cache: "no-store"
    });
    if (!response.ok) throw new Error(`Exam submit trả về HTTP ${response.status}`);
    if (isMock) {
      const text = await response.text();
      let result: unknown = {};
      try { result = JSON.parse(text); } catch { result = { transportResponse: text || "empty" }; }
      const normalized = normalizeMockSubmitResponse(result, payload);
      if (!normalized.ok) throw new Error(String((result as Record<string, unknown>)?.error || "Không thể ghi kết quả Thi thử"));
      return normalized;
    }
    const result = await response.json() as SubmitExamResponse & { error?: string };
    if (!result.ok) throw new Error(result.error || "Không thể ghi kết quả kiểm tra");
    return result;
  },

  async getResultSummary(params: ResultSummaryParams): Promise<any> {
    if (params.apiSource === "mock") {
      const payload = await getJson<unknown>("myResults", { name: params.user, unit: params.unit }, "mock");
      return normalizeMockResults(payload);
    }
    return getJson<any>("results", { bank: params.bank, user: params.user, unit: params.unit });
  },

  async getLeaderboard(params: LeaderboardParams): Promise<LeaderboardResponse> {
    if (params.apiSource === "mock") {
      const text = await getText("leaderboard", { bank: params.bank, scope: params.scope, limit: params.limit }, "mock");
      let payload: unknown = {};
      try { payload = JSON.parse(text); } catch { payload = { transportResponse: text }; }
      return normalizeMockLeaderboard(payload, params);
    }
    return getJson<LeaderboardResponse>("leaderboard", {
      bank: params.bank,
      scope: params.scope,
      limit: params.limit ?? (params.scope === "user" ? 10 : 3),
      bestOf: params.bestOf
    });
  },

  async getLeaderboardExams(): Promise<any> {
    const [officialResult, mockResult] = await Promise.allSettled([
      getJson<any>("leaderboard", { meta: "exams" }),
      this.getMockExams()
    ]);
    const official = officialResult.status === "fulfilled" ? officialResult.value : {};
    const mock = mockResult.status === "fulfilled" ? mockResult.value : [];
    if ((import.meta as any).env?.DEV) {
      if (officialResult.status === "rejected") console.warn("[examService] Không tải được leaderboard meta exams:", officialResult.reason);
      if (mockResult.status === "rejected") console.warn("[examService] Không tải được danh sách Thi thử:", mockResult.reason);
    }
    const officialRows = Array.isArray(official?.exams) ? official.exams.map((row: any) => ({ ...row, apiSource: "official" })) : [];
    const mockRows = mock.map(bank => ({ id: bank.bankId, bank: bank.bankId, title: bank.title, apiSource: "mock" }));
    return { ...official, exams: [...mockRows, ...officialRows] };
  },

  async pingExamApi(): Promise<any> {
    return getJson<any>("ping");
  },

  wasFallbackUsed(): boolean {
    return fallbackUsed;
  },

  hasMockApiError(): boolean {
    return mockApiError;
  },

  async getExamHistory(): Promise<ExamAttempt[]> {
    if (isLegacyAppsScriptAuthMode()) return cdsLegacyService.getExamHistory();
    return apiClient.get<ExamAttempt[]>("/api/exam-attempts/history");
  },

  async getExams(): Promise<Exam[]> {
    if (isLegacyAppsScriptAuthMode()) {
      const [official, mock] = await Promise.all([this.getOfficialExams(), this.getMockExams()]);
      return [...official, ...mock].map(bankToExam);
    }
    return apiClient.get<Exam[]>("/api/exams");
  },

  async getExamById(id: string): Promise<Exam & { questions: Question[] }> {
    if (isLegacyAppsScriptAuthMode()) {
      const exams = (await this.getExams()) as ExamWithBank[];
      const exam = exams.find(item => item.id === id) || exams[0];
      const response = exam.apiSource === "mock" ? await this.getMockExamQuestions(exam.bankId) : await this.getExamQuestions(exam.bankId);
      return { ...exam, questions: response.questions.map(question => toUiQuestion(question, exam.bankId)) };
    }
    return apiClient.get<Exam & { questions: Question[] }>(`/api/exams/${id}`);
  },

  async createExam(data: Partial<Exam>): Promise<Exam> {
    return apiClient.post<Exam>("/api/exams", data);
  },

  async updateExam(id: string, data: Partial<Exam>): Promise<Exam> {
    return apiClient.patch<Exam>(`/api/exams/${id}`, data);
  },

  async startExam(examId: string): Promise<ExamAttempt> {
    return apiClient.post<ExamAttempt>("/api/exam-attempts/start", { examId });
  },

  async submitExam(attemptId: string, answers: { [questionId: string]: number[] }): Promise<{ attempt: ExamAttempt; passed: boolean; score: number }> {
    return apiClient.post<{ attempt: ExamAttempt; passed: boolean; score: number }>("/api/exam-attempts/submit", { attemptId, answers });
  }
};

export default examService;
