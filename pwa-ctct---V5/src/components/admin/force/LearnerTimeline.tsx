import React from "react";
import { AnalyticsEventRecord } from "../../../services/analyticsService";
import { AppCaption, AppHeading, EmptyState } from "../../ui";
import { eventLabel, eventTime } from "./forceUtils";

export default function LearnerTimeline({ events }: { events: AnalyticsEventRecord[] }) {
  return <section className="pixel-surface-flat p-3"><AppHeading level="h3" variant="title">Timeline hoạt động</AppHeading>{events.length ? <ol className="mt-2 space-y-3">{events.slice(0, 20).map(event => <li key={event.eventId} className="border-l-2 border-red-200 pl-3"><p className="font-semibold">{eventLabel(event.eventType)}</p><AppCaption>{event.resourceTitle || event.category || "Hoạt động trên hệ thống"} · {eventTime(event)}</AppCaption></li>)}</ol> : <EmptyState className="mt-2" title="Chưa có hoạt động được ghi nhận" />}</section>;
}

