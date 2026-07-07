import React from "react";
import { AnalyticsEventRecord } from "../../../services/analyticsService";
import { AppCaption, AppHeading, EmptyState } from "../../ui";
import { eventLabel, eventTime } from "./forceUtils";

export default function ProfileReviewHistory({ events }: { events: AnalyticsEventRecord[] }) {
  const rows = events.filter(event => ["REVIEW_OPEN", "REVIEW_COMPLETE"].includes(event.eventType));
  return <section className="pixel-surface-flat p-3"><AppHeading level="h3" variant="title">Lịch sử ôn tập</AppHeading>{rows.length ? <div className="mt-2 space-y-2">{rows.map(event => <div key={event.eventId}><p className="font-semibold">{eventLabel(event.eventType)} · {event.resourceTitle || "Nội dung ôn tập"}</p><AppCaption>{eventTime(event)}</AppCaption></div>)}</div> : <EmptyState className="mt-2" title="Chưa có lịch sử ôn tập" />}</section>;
}

