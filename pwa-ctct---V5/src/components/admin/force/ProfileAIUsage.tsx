import React from "react";
import { AnalyticsEventRecord } from "../../../services/analyticsService";
import { AppCaption, AppHeading, EmptyState } from "../../ui";
import { eventTime } from "./forceUtils";

export default function ProfileAIUsage({ events }: { events: AnalyticsEventRecord[] }) {
  const rows = events.filter(event => ["AI_PROMPT", "AI_RESPONSE"].includes(event.eventType));
  return <section className="pixel-surface-flat p-3"><AppHeading level="h3" variant="title">Lịch sử hỏi AI</AppHeading><AppCaption>Không hiển thị nội dung câu hỏi hoặc câu trả lời nhạy cảm.</AppCaption>{rows.length ? <><p className="mt-2 text-xl font-extrabold">{rows.filter(event => event.eventType === "AI_PROMPT").length} lượt hỏi</p><div className="mt-2 space-y-1">{rows.slice(0, 10).map(event => <AppCaption key={event.eventId} className="block">{event.category || event.resourceTitle || "Hỗ trợ học tập"} · {eventTime(event)}</AppCaption>)}</div></> : <EmptyState className="mt-2" title="Chưa có lịch sử hỏi AI" />}</section>;
}

