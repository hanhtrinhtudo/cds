import { User } from "../types";

export type PoliticalAIMode = "FAST" | "DEEP" | "DRILL" | "EXPLAIN" | "POLICY" | "STUDY_PLAN";
export type AISourceType = "learning" | "policy" | "exam" | "review";

export interface PoliticalAIUser {
  id: string;
  name: string;
  unit: string;
  role: string;
}

export interface PoliticalAIContext {
  currentMaterial?: Record<string, unknown>;
  recentReview?: Record<string, unknown>;
  weakTopics?: unknown[];
  policyDocs?: unknown[];
  questionBank?: unknown[];
  [key: string]: unknown;
}

export interface PoliticalAIRequest {
  mode: PoliticalAIMode;
  question: string;
  fileId?: string;
  materialTitle?: string;
  section?: string;
  user: PoliticalAIUser;
  context?: PoliticalAIContext;
}

export interface PoliticalAISource {
  type: AISourceType;
  title: string;
  id?: string;
  url?: string;
}

export interface PoliticalAIResponse {
  answer: string;
  sources: PoliticalAISource[];
  mode: PoliticalAIMode;
  model: string;
  provider: string;
  warnings: string[];
}

interface GatewayResponse {
  ok?: boolean;
  data?: Partial<PoliticalAIResponse> & { content?: string };
  answer?: string;
  content?: string;
  error?: string;
}

const env = (key: string) => String((import.meta as any).env?.[key] || "").trim();
const isDevelopment = () => Boolean((import.meta as any).env?.DEV);

export const getAIGatewayUrl = () => env("VITE_AI_GATEWAY_URL");
export const getAIProvider = () => env("VITE_AI_PROVIDER") || "openai";
export const getAIModel = () => env("VITE_AI_MODEL") || "gpt-4.1";

const normalizeSources = (value: unknown): PoliticalAISource[] => {
  if (!Array.isArray(value)) return [];
  return value.map(item => {
    const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
    const sourceType = ["learning", "policy", "exam", "review"].includes(String(row.type))
      ? String(row.type) as AISourceType
      : "learning";
    return {
      type: sourceType,
      title: String(row.title || row.name || "Nguồn tham khảo"),
      id: row.id ? String(row.id) : undefined,
      url: row.url ? String(row.url) : undefined
    };
  });
};

const callGateway = async (action: "ai.chat" | "ai.summary" | "ai.explainQuestion", request: PoliticalAIRequest): Promise<PoliticalAIResponse> => {
  const gatewayUrl = getAIGatewayUrl();
  if (!gatewayUrl) throw new Error("AI_GATEWAY_NOT_CONFIGURED");

  const response = await fetch(gatewayUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=UTF-8" },
    body: JSON.stringify({
      action,
      payload: {
        ...request,
        provider: getAIProvider(),
        model: getAIModel(),
        context: {
          currentMaterial: {},
          recentReview: {},
          weakTopics: [],
          policyDocs: [],
          questionBank: [],
          ...(request.context || {})
        }
      }
    }),
    cache: "no-store"
  });

  if (!response.ok) throw new Error(`AI_GATEWAY_HTTP_${response.status}`);
  const result = await response.json() as GatewayResponse;
  if (result.ok === false) throw new Error(result.error || "AI_GATEWAY_REJECTED");

  const data = result.data || {};
  const answer = String(data.answer || data.content || result.answer || result.content || "").trim();
  if (!answer) throw new Error("AI_GATEWAY_EMPTY_ANSWER");

  return {
    answer,
    sources: normalizeSources(data.sources),
    mode: (data.mode || request.mode) as PoliticalAIMode,
    model: String(data.model || getAIModel()),
    provider: String(data.provider || getAIProvider()),
    warnings: Array.isArray(data.warnings) ? data.warnings.map(String) : []
  };
};

const logDevelopmentError = (operation: string, error: unknown) => {
  if (isDevelopment()) console.error(`[aiService] ${operation}:`, error);
};

const withSafeLogging = async (operation: string, task: () => Promise<PoliticalAIResponse>) => {
  try {
    return await task();
  } catch (error) {
    logDevelopmentError(operation, error);
    throw error;
  }
};

export const toPoliticalAIUser = (user: User, unitName?: string): PoliticalAIUser => ({
  id: user.id,
  name: user.fullName,
  unit: unitName || user.unitId,
  role: user.role
});

export const aiService = {
  isConfigured(): boolean {
    return Boolean(getAIGatewayUrl());
  },

  async chatWithPoliticalAI(payload: PoliticalAIRequest): Promise<PoliticalAIResponse> {
    return withSafeLogging("chat", () => callGateway("ai.chat", payload));
  },

  async summarizeMaterial(fileId: string, payload: Omit<PoliticalAIRequest, "mode" | "fileId">): Promise<PoliticalAIResponse> {
    return withSafeLogging("summary", () => callGateway("ai.summary", { ...payload, mode: "FAST", fileId }));
  },

  async explainQuestion(payload: Omit<PoliticalAIRequest, "mode">): Promise<PoliticalAIResponse> {
    return withSafeLogging("explainQuestion", () => callGateway("ai.explainQuestion", { ...payload, mode: "EXPLAIN" }));
  },

  async generateStudyPlan(payload: Omit<PoliticalAIRequest, "mode">): Promise<PoliticalAIResponse> {
    return withSafeLogging("studyPlan", () => callGateway("ai.chat", { ...payload, mode: "STUDY_PLAN" }));
  },

  async askPolicyQuestion(payload: Omit<PoliticalAIRequest, "mode">): Promise<PoliticalAIResponse> {
    return withSafeLogging("policy", () => callGateway("ai.chat", { ...payload, mode: "POLICY" }));
  }
};

export default aiService;
