import React from "react";
import { AnalyticsEventRecord } from "../../../services/analyticsService";
import { AppCaption, AppHeading, EmptyState } from "../../ui";
import { eventTime } from "./forceUtils";

export default function ProfileNewsViews({ events }: { events: AnalyticsEventRecord[] }) {
  const rows = events.filter(event => event.eventType === "NEWS_VIEW");
  return <section className="pixel-surface-flat p-3"><AppHeading level="h3" variant="title">Lịch sử đọc tin tức</AppHeading>{rows.length ? <div className="mt-2 space-y-2">{rows.map(event => <div key={event.eventId}><p className="font-semibold">{event.resourceTitle || "Tin tức"}</p><AppCaption>{eventTime(event)}</AppCaption></div>)}</div> : <EmptyState className="mt-2" title="Chưa có lịch sử đọc tin tức" />}</section>;
}

