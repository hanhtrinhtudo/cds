import { LearningProgress, LearningStatus, QuizAttempt } from "../types";
import { ReviewPack, ReviewSourceType } from "./reviewService";

const env = (key: string) => String((import.meta as any).env?.[key] || "").trim();
export const getPersistenceApiUrl = () =>
  env("VITE_PERSISTENCE_API_URL") ||
  env("VITE_APPS_SCRIPT_API_URL") ||
  env("VITE_LEGACY_AUTH_API_URL");
const REQUEST_TIMEOUT_MS = 12_000;

export type PersistenceAction =
  | "progress.get" | "progress.upsert"
  | "quizAttempt.save" | "quizAttempt.listMine"
  | "review.save" | "review.listMine"
  | "bookmark.list" | "bookmark.toggle";

export interface PersistenceHealth {
  ok: boolean;
  service: "persistence";
  supportsPersistence: boolean;
  apiVersion: number;
  schemaVersion: number;
  build?: string;
  sheetsReady: boolean;
  actions?: string[];
  time?: string;
}

export interface ProgressWritePayload {
  topicId: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "NEED_REVIEW";
  progressPercent: number;
  needReview?: boolean;
  startedAt?: string;
  version?: number;
}

export interface QuizAttemptWritePayload {
  attemptId: string;
  quizType: "practice" | "learningQuiz";
  topicId?: string;
  startedAt?: string;
  submittedAt: string;
  score: number;
  correct: number;
  wrong: number;
  skip: number;
  total: number;
  answers: Record<string, number[]> | unknown[];
  device?: string;
}

export interface ReviewWritePayload extends Omit<ReviewPack, "sourceType"> {
  sourceType: ReviewSourceType;
}

export interface BookmarkRecord {
  bookmarkId: string;
  userId: string;
  resourceType: "learning_topic";
  resourceId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BookmarkWritePayload {
  resourceType: "learning_topic";
  resourceId: string;
  active: boolean;
}

export class PersistenceError extends Error {
  code: string;
  retryable: boolean;

  constructor(code: string, retryable = false) {
    super("Không thể đồng bộ dữ liệu học tập.");
    this.name = "PersistenceError";
    this.code = code;
    this.retryable = retryable;
  }
}

const request = async <T>(action: string, token?: string, payload: Record<string, unknown> = {}, write = false): Promise<T> => {
  const base = getPersistenceApiUrl();
  if (!base) throw new PersistenceError("PERSISTENCE_URL_MISSING");
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const url = new URL(base);
    url.searchParams.set("action", action);
    const response = await fetch(url.toString(), {
      method: write ? "POST" : "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify({ ...(token ? { token } : {}), ...payload }),
      cache: "no-store",
      signal: controller.signal
    });
    if (!response.ok) throw new PersistenceError(`HTTP_${response.status}`, response.status >= 500);
    const text = await response.text();
    let json: any;
    try { json = text ? JSON.parse(text) : {}; }
    catch { throw new PersistenceError("INVALID_RESPONSE", true); }
    if (json?.ok !== true) {
      const code = String(json?.error || "PERSISTENCE_REJECTED");
      const retryable = code === "PERSISTENCE_ERROR" || code === "TEMPORARY_UNAVAILABLE";
      throw new PersistenceError(code, retryable);
    }
    return json as T;
  } catch (error) {
    if (error instanceof PersistenceError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") throw new PersistenceError("TIMEOUT", true);
    throw new PersistenceError("NETWORK_ERROR", true);
  } finally {
    window.clearTimeout(timeout);
  }
};

const value = (row: any, camel: string, pascal: string) => row?.[camel] ?? row?.[pascal];
const bool = (input: unknown) => input === true || String(input).toLowerCase() === "true" || String(input) === "1";

export const mapRemoteBookmark = (row: any): BookmarkRecord => ({
  bookmarkId: String(value(row, "bookmarkId", "BookmarkID") || ""),
  userId: String(value(row, "userId", "UserID") || ""),
  resourceType: "learning_topic",
  resourceId: String(value(row, "resourceId", "ResourceID") || ""),
  active: bool(value(row, "active", "Active")),
  createdAt: String(value(row, "createdAt", "CreatedAt") || ""),
  updatedAt: String(value(row, "updatedAt", "UpdatedAt") || "")
});

const statusFromRemote = (status: unknown): LearningStatus => {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "COMPLETED") return LearningStatus.COMPLETED;
  if (normalized === "NEED_REVIEW") return LearningStatus.NEED_REVIEW;
  if (normalized === "IN_PROGRESS") return LearningStatus.IN_PROGRESS;
  return LearningStatus.NOT_STARTED;
};

export const mapRemoteProgress = (row: any): LearningProgress & { version?: number; updatedAt?: string } => ({
  id: String(value(row, "progressId", "ProgressID") || ""),
  userId: String(value(row, "userId", "UserID") || ""),
  topicId: String(value(row, "topicId", "TopicID") || ""),
  status: statusFromRemote(value(row, "status", "Status")),
  progressPercent: Number(value(row, "progressPercent", "ProgressPercent") || 0),
  needReview: bool(value(row, "needReview", "NeedReview")),
  startedAt: String(value(row, "startedAt", "StartedAt") || new Date().toISOString()),
  completedAt: String(value(row, "completedAt", "CompletedAt") || "") || undefined,
  lastAccessedAt: String(value(row, "lastAccessedAt", "LastAccessedAt") || value(row, "updatedAt", "UpdatedAt") || new Date().toISOString()),
  version: Number(value(row, "version", "Version") || 0),
  updatedAt: String(value(row, "updatedAt", "UpdatedAt") || "")
});

export const mapRemoteQuizAttempt = (row: any): QuizAttempt => ({
  id: String(value(row, "attemptId", "AttemptID") || ""),
  userId: String(value(row, "userId", "UserID") || ""),
  quizType: value(row, "topicId", "TopicID") ? "topic" : "random",
  topicId: String(value(row, "topicId", "TopicID") || "") || undefined,
  startedAt: String(value(row, "startedAt", "StartedAt") || ""),
  submittedAt: String(value(row, "submittedAt", "SubmittedAt") || "") || undefined,
  score: Number(value(row, "score", "Score") || 0),
  correctCount: Number(value(row, "correct", "Correct") || 0),
  wrongCount: Number(value(row, "wrong", "Wrong") || 0),
  totalQuestions: Number(value(row, "total", "Total") || 0),
  answers: (() => {
    const raw = value(row, "answers", "AnswersJSON");
    if (raw && typeof raw === "object") return raw;
    try { return JSON.parse(String(raw || "{}")); } catch { return {}; }
  })(),
  status: "submitted"
});

export const mapRemoteReview = (row: any): ReviewPack => ({
  sourceType: String(value(row, "sourceType", "SourceType") || "practice") as ReviewSourceType,
  attemptId: String(value(row, "attemptId", "AttemptID") || ""),
  title: String(value(row, "title", "Title") || ""),
  submittedAt: String(value(row, "submittedAt", "SubmittedAt") || ""),
  score: Number(value(row, "score", "Score") || 0),
  total: Number(value(row, "total", "Total") || 0),
  correct: Number(value(row, "correct", "Correct") || 0),
  wrong: Number(value(row, "wrong", "Wrong") || 0),
  skip: Number(value(row, "skip", "Skip") || 0),
  updatedAt: String(value(row, "updatedAt", "UpdatedAt") || value(row, "submittedAt", "SubmittedAt") || ""),
  answers: (() => {
    const raw = value(row, "answers", "AnswersJSON");
    if (Array.isArray(raw)) return raw;
    try { const parsed = JSON.parse(String(raw || "[]")); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
  })()
});

type VersionedProgress = LearningProgress & { version?: number; updatedAt?: string };

export const resolveProgressConflict = (local: VersionedProgress | undefined, remote: VersionedProgress): VersionedProgress => {
  if (!local) return remote;
  if (local.status === LearningStatus.COMPLETED && remote.status !== LearningStatus.COMPLETED) return local;
  if (remote.status === LearningStatus.COMPLETED && local.status !== LearningStatus.COMPLETED) return remote;
  if (remote.progressPercent !== local.progressPercent) return remote.progressPercent > local.progressPercent ? remote : local;
  const remoteVersion = Number(remote.version || 0);
  const localVersion = Number(local.version || 0);
  if (remoteVersion !== localVersion) return remoteVersion > localVersion ? remote : local;
  return Date.parse(remote.updatedAt || remote.lastAccessedAt || "") >= Date.parse(local.updatedAt || local.lastAccessedAt || "") ? remote : local;
};

export const mergeProgressRecords = (local: VersionedProgress[], remote: VersionedProgress[]): VersionedProgress[] => {
  const merged = new Map(local.map(item => [item.topicId, item]));
  remote.forEach(item => merged.set(item.topicId, resolveProgressConflict(merged.get(item.topicId), item)));
  return Array.from(merged.values());
};

export const mergeAttemptsById = (local: QuizAttempt[], remote: QuizAttempt[]): QuizAttempt[] => {
  const merged = new Map(local.map(item => [item.id, item]));
  remote.forEach(item => merged.set(item.id, item)); // persisted immutable row is authoritative
  return Array.from(merged.values()).sort((a, b) => Date.parse(b.submittedAt || b.startedAt) - Date.parse(a.submittedAt || a.startedAt));
};

export const mergeReviewsByAttempt = (local: ReviewPack[], remote: ReviewPack[]): ReviewPack[] => {
  const merged = new Map(local.map(item => [item.attemptId, item]));
  remote.forEach(item => {
    const current = merged.get(item.attemptId);
    if (!current || Date.parse(item.updatedAt || item.submittedAt) >= Date.parse(current.updatedAt || current.submittedAt)) merged.set(item.attemptId, item);
  });
  return Array.from(merged.values()).sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt));
};

export const resolveBookmarkConflict = (local: BookmarkRecord | undefined, remote: BookmarkRecord): BookmarkRecord => {
  if (!local) return remote;
  return Date.parse(remote.updatedAt || remote.createdAt) >= Date.parse(local.updatedAt || local.createdAt) ? remote : local;
};

export const persistenceService = {
  async health(): Promise<PersistenceHealth> {
    return request<PersistenceHealth>("persistence.health");
  },

  isSupported(health: Partial<PersistenceHealth> | null): boolean {
    return Boolean(health?.ok && health.service === "persistence" && health.supportsPersistence && Number(health.apiVersion) >= 1 && Number(health.schemaVersion) >= 1 && health.sheetsReady);
  },

  async getProgress(token: string, topicId?: string): Promise<LearningProgress[]> {
    const result = await request<{ ok: true; items: any[] }>("progress.get", token, topicId ? { topicId } : {});
    return (result.items || []).map(mapRemoteProgress);
  },

  upsertProgress(token: string, payload: ProgressWritePayload) {
    return request<{ ok: true; created: boolean; item: any }>("progress.upsert", token, payload as unknown as Record<string, unknown>, true);
  },

  saveQuizAttempt(token: string, payload: QuizAttemptWritePayload) {
    return request<{ ok: true; created: boolean; item: any }>("quizAttempt.save", token, payload as unknown as Record<string, unknown>, true);
  },

  async listQuizAttempts(token: string): Promise<QuizAttempt[]> {
    const result = await request<{ ok: true; items: any[] }>("quizAttempt.listMine", token);
    return (result.items || []).map(mapRemoteQuizAttempt);
  },

  saveReview(token: string, payload: ReviewWritePayload) {
    return request<{ ok: true; created: boolean; item: any }>("review.save", token, payload as unknown as Record<string, unknown>, true);
  },

  async listReviews(token: string): Promise<ReviewPack[]> {
    const result = await request<{ ok: true; items: any[] }>("review.listMine", token);
    return (result.items || []).map(mapRemoteReview);
  },

  async listBookmarks(token: string): Promise<BookmarkRecord[]> {
    const result = await request<{ ok: true; items: any[] }>("bookmark.list", token);
    return (result.items || []).map(mapRemoteBookmark);
  },

  toggleBookmark(token: string, payload: BookmarkWritePayload) {
    return request<{ ok: true; created: boolean; item: any }>("bookmark.toggle", token, payload as unknown as Record<string, unknown>, true);
  }
};

export default persistenceService;
