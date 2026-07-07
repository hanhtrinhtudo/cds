import { getPersistenceApiUrl } from "./persistenceService";

const REQUEST_TIMEOUT_MS = 10_000;

export type AnalyticsEventType =
  | "LOGIN" | "LOGOUT" | "APP_OPEN" | "TAB_OPEN"
  | "OPEN_TOPIC" | "OPEN_DOCUMENT" | "READ_PROGRESS" | "MARK_COMPLETE"
  | "BOOKMARK_ADD" | "BOOKMARK_REMOVE"
  | "QUIZ_START" | "QUIZ_SUBMIT"
  | "REVIEW_OPEN" | "REVIEW_COMPLETE"
  | "NEWS_VIEW"
  | "AI_OPEN" | "AI_PROMPT" | "AI_RESPONSE"
  | "PROFILE_OPEN" | "RESULTS_OPEN"
  | "ADMIN_OPEN" | "ADMIN_VIEW_USER" | "ADMIN_VIEW_REPORT";

export interface AnalyticsHealth {
  ok: boolean;
  service: "analytics";
  supportsAnalytics: boolean;
  apiVersion: number;
  schemaVersion: number;
  build?: string;
  sheetsReady: boolean;
  actions?: string[];
  time?: string;
}

export interface AnalyticsEventPayload {
  eventId?: string;
  eventType: AnalyticsEventType;
  resourceType?: string;
  resourceId?: string;
  resourceTitle?: string;
  category?: string;
  score?: number;
  progressPercent?: number;
  durationSeconds?: number;
  status?: string;
  metadata?: Record<string, unknown>;
  clientTime?: string;
  sessionId?: string;
  device?: string;
  appVersion?: string;
}

export interface AnalyticsEventRecord extends AnalyticsEventPayload {
  eventId: string;
  userId: string;
  username?: string;
  fullName?: string;
  unit?: string;
  role?: string;
  createdAt: string;
}

export interface AnalyticsFilters {
  range?: "today" | "7d" | "30d";
  unit?: string;
  eventType?: string;
  userId?: string;
  query?: string;
  limit?: number;
}

export interface AnalyticsSummary {
  totalUsers?: number;
  activeToday?: number;
  loggedInToday?: number;
  learningToday?: number;
  completedTopics?: number;
  quizSubmissions?: number;
  averageScore?: number;
  weakLearners?: number;
  units?: Array<{ unit: string; users: number; activeUsers: number; completionRate: number; averageScore: number; peqiAverage?: number }>;
  recentEvents?: AnalyticsEventRecord[];
}

export interface PEQIResult {
  score: number;
  level: "Xuất sắc" | "Tốt" | "Đạt" | "Cần hỗ trợ" | "Nguy cơ thấp/chưa tham gia";
  factors: Record<string, number>;
  riskFlags: string[];
  recommendation: string;
}

export class AnalyticsError extends Error {
  code: string;
  retryable: boolean;

  constructor(code: string, retryable = false) {
    super("Không thể đồng bộ dữ liệu phân tích học tập.");
    this.name = "AnalyticsError";
    this.code = code;
    this.retryable = retryable;
  }
}

const request = async <T>(action: string, token?: string, payload: Record<string, unknown> = {}): Promise<T> => {
  const base = getPersistenceApiUrl();
  if (!base) throw new AnalyticsError("ANALYTICS_URL_MISSING");
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const url = new URL(base);
    url.searchParams.set("action", action);
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify({ ...(token ? { token } : {}), ...payload }),
      cache: "no-store",
      signal: controller.signal
    });
    if (!response.ok) throw new AnalyticsError(`HTTP_${response.status}`, response.status >= 500);
    const text = await response.text();
    let json: any;
    try { json = text ? JSON.parse(text) : {}; }
    catch { throw new AnalyticsError("INVALID_RESPONSE", true); }
    if (json?.ok !== true || json?.error) {
      throw new AnalyticsError(String(json?.error || "ANALYTICS_REJECTED"), true);
    }
    return json as T;
  } catch (error) {
    if (error instanceof AnalyticsError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") throw new AnalyticsError("TIMEOUT", true);
    throw new AnalyticsError("NETWORK_ERROR", true);
  } finally {
    window.clearTimeout(timeout);
  }
};

const sanitizeEvent = (event: AnalyticsEventPayload): AnalyticsEventPayload => {
  const metadata = { ...(event.metadata || {}) };
  if (event.eventType === "AI_PROMPT" || event.eventType === "AI_RESPONSE") {
    delete metadata.prompt;
    delete metadata.question;
    delete metadata.answer;
    delete metadata.response;
    delete metadata.content;
  }
  return {
    ...event,
    metadata,
    clientTime: event.clientTime || new Date().toISOString(),
    device: event.device || "web",
    appVersion: event.appVersion || "ptkv-static"
  };
};

export const analyticsService = {
  async health(token?: string): Promise<AnalyticsHealth> {
    return request<AnalyticsHealth>("analytics.health", token);
  },

  isSupported(health: Partial<AnalyticsHealth> | null): boolean {
  return Boolean(
    health?.ok === true &&
    String(health.service || "").toLowerCase() === "analytics" &&
    health.supportsAnalytics === true &&
    health.sheetsReady === true
  );
},

  logEvent(token: string, event: AnalyticsEventPayload) {
    return request<{ ok: true; created?: boolean; item?: AnalyticsEventRecord }>("analytics.event.log", token, sanitizeEvent(event) as unknown as Record<string, unknown>);
  },

  async getMyEvents(token: string, filters: AnalyticsFilters = {}): Promise<AnalyticsEventRecord[]> {
    const result = await request<{ ok: true; items?: AnalyticsEventRecord[] }>("analytics.events.mine", token, filters as Record<string, unknown>);
    return result.items || [];
  },

  async adminListEvents(token: string, filters: AnalyticsFilters = {}): Promise<AnalyticsEventRecord[]> {
    const result = await request<{ ok: true; items?: AnalyticsEventRecord[] }>("analytics.events.adminlist", token, filters as Record<string, unknown>);
    return result.items || [];
  },

  async getAdminSummary(token: string, filters: AnalyticsFilters = {}): Promise<AnalyticsSummary> {
    const result = await request<{ ok: true; data?: AnalyticsSummary }>("analytics.summary.admin", token, filters as Record<string, unknown>);
    return result.data || {};
  },

  async getUserSummary(token: string, userId: string): Promise<AnalyticsSummary> {
    const result = await request<{ ok: true; data?: AnalyticsSummary }>("analytics.summary.user", token, { userId });
    return result.data || {};
  },

  async getUnitSummary(token: string, unit: string): Promise<AnalyticsSummary> {
    const result = await request<{ ok: true; data?: AnalyticsSummary }>("analytics.summary.unit", token, { unit });
    return result.data || {};
  },

  async getUserPEQI(token: string, userId: string): Promise<PEQIResult | null> {
    const result = await request<{ ok: true; data?: PEQIResult }>("analytics.peqi.user", token, { userId });
    return result.data || null;
  },

  async getUnitPEQI(token: string, unit: string): Promise<PEQIResult | null> {
    const result = await request<{ ok: true; data?: PEQIResult }>("analytics.peqi.unit", token, { unit });
    return result.data || null;
  }
};

export default analyticsService;
