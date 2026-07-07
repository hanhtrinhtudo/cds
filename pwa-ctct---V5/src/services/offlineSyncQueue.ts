import { persistenceService, PersistenceAction } from "./persistenceService";

export const OFFLINE_SYNC_QUEUE_KEY = "ptkv_offline_sync_queue_v1";
export const MAX_SYNC_ATTEMPTS = 5;

export interface OfflineSyncItem {
  id: string;
  userId: string;
  type: Extract<PersistenceAction, "progress.upsert" | "quizAttempt.save" | "review.save" | "bookmark.toggle">;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  attempts: number;
  lastError: string;
  idempotencyKey: string;
  nextAttemptAt?: string;
}

const read = (): OfflineSyncItem[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(OFFLINE_SYNC_QUEUE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
};

const write = (items: OfflineSyncItem[]) => localStorage.setItem(OFFLINE_SYNC_QUEUE_KEY, JSON.stringify(items.slice(-200)));
const now = () => new Date().toISOString();
const backoffMs = (attempts: number) => Math.min(60_000, 1000 * 2 ** Math.max(0, attempts - 1));

const operationKey = (type: OfflineSyncItem["type"], payload: Record<string, unknown>) => {
  if (type === "quizAttempt.save" || type === "review.save") return String(payload.attemptId || "");
  if (type === "progress.upsert") return String(payload.topicId || "");
  return `${String(payload.resourceType || "")}:${String(payload.resourceId || "")}`;
};

export const offlineSyncQueue = {
  list(userId?: string): OfflineSyncItem[] {
    const items = read();
    return userId ? items.filter(item => item.userId === userId) : items;
  },

  enqueue(userId: string, type: OfflineSyncItem["type"], payload: Record<string, unknown>, idempotencyKey?: string): OfflineSyncItem {
    const timestamp = now();
    const key = idempotencyKey || operationKey(type, payload) || crypto.randomUUID();
    const items = read();
    const duplicateIndex = items.findIndex(item => item.userId === userId && item.type === type && item.idempotencyKey === key);
    const item: OfflineSyncItem = duplicateIndex >= 0
      ? { ...items[duplicateIndex], payload, updatedAt: timestamp, lastError: items[duplicateIndex].lastError }
      : { id: crypto.randomUUID(), userId, type, payload, createdAt: timestamp, updatedAt: timestamp, attempts: 0, lastError: "", idempotencyKey: key };
    if (duplicateIndex >= 0) items[duplicateIndex] = item; else items.push(item);
    write(items);
    return item;
  },

  async flushQueue(token: string, userId: string): Promise<{ succeeded: number; failed: number; pending: number }> {
    const items = read();
    let succeeded = 0;
    let failed = 0;
    for (const item of items.filter(entry => entry.userId === userId && entry.attempts < MAX_SYNC_ATTEMPTS)) {
      if (item.nextAttemptAt && Date.parse(item.nextAttemptAt) > Date.now()) continue;
      try {
        if (item.type === "progress.upsert") await persistenceService.upsertProgress(token, item.payload as any);
        if (item.type === "quizAttempt.save") await persistenceService.saveQuizAttempt(token, item.payload as any);
        if (item.type === "review.save") await persistenceService.saveReview(token, item.payload as any);
        if (item.type === "bookmark.toggle") await persistenceService.toggleBookmark(token, item.payload as any);
        const index = items.findIndex(entry => entry.id === item.id);
        if (index >= 0) items.splice(index, 1);
        succeeded++;
      } catch (error) {
        const index = items.findIndex(entry => entry.id === item.id);
        if (index < 0) continue;
        const attempts = items[index].attempts + 1;
        items[index] = {
          ...items[index], attempts, updatedAt: now(),
          lastError: error instanceof Error ? error.name : "SyncError",
          nextAttemptAt: new Date(Date.now() + backoffMs(attempts)).toISOString()
        };
        failed++;
      }
      write(items);
    }
    return { succeeded, failed, pending: items.filter(item => item.userId === userId).length };
  }
};

export const flushQueue = (token: string, userId: string) => offlineSyncQueue.flushQueue(token, userId);
export default offlineSyncQueue;
