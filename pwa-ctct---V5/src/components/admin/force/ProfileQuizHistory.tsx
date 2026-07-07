import React from "react";
import { AnalyticsEventRecord } from "../../../services/analyticsService";
import { AppCaption, AppHeading, EmptyState } from "../../ui";
import { eventTime } from "./forceUtils";

export default function ProfileQuizHistory({ events }: { events: AnalyticsEventRecord[] }) {
  const rows = events.filter(event => event.eventType === "QUIZ_SUBMIT");
  return <section className="pixel-surface-flat p-3"><AppHeading level="h3" variant="title">Lịch sử kiểm tra</AppHeading>{rows.length ? <div className="mt-2 space-y-2">{rows.map(event => <div key={event.eventId} className="rounded-xl bg-[var(--app-color-surface-soft)] p-2"><p className="font-semibold">{event.resourceTitle || "Bài kiểm tra"}</p><AppCaption>{event.score == null ? "Chưa có điểm" : `${event.score}/10`} · {eventTime(event)}</AppCaption></div>)}</div> : <EmptyState className="mt-2" title="Chưa có lịch sử kiểm tra" />}</section>;
}

