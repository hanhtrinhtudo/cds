import React from "react";
import { Clock3 } from "lucide-react";
import { AnalyticsEventRecord } from "../../../services/analyticsService";
import { AppCaption, AppHeading, AppText, EmptyState, Skeleton } from "../../ui";
import { eventTypeLabel, formatTime, metricText } from "./dashboardUtils";

interface RealtimeActivityFeedProps {
  loading: boolean;
  available: boolean;
  events: AnalyticsEventRecord[];
  onSelect: (event: AnalyticsEventRecord) => void;
}

export default function RealtimeActivityFeed({ loading, available, events, onSelect }: RealtimeActivityFeedProps) {
  return (
    <section className="pixel-surface p-4" id="realtime-activity-feed">
      <div className="flex items-center justify-between gap-3">
        <div>
          <AppHeading level="h2" variant="title">Hoạt động realtime</AppHeading>
          <AppCaption>Nhật ký hoạt động học tập mới nhất.</AppCaption>
        </div>
        <Clock3 size={18} className="text-[var(--app-color-text-muted)]" />
      </div>

      {loading && <div className="mt-3 space-y-3"><Skeleton variant="list" /><Skeleton variant="list" /><Skeleton variant="list" /></div>}

      {!loading && !available && (
        <EmptyState className="mt-3" title="Kho phân tích chưa sẵn sàng" description="Chưa thể hiển thị dòng hoạt động realtime." />
      )}

      {!loading && available && events.length === 0 && (
        <EmptyState className="mt-3" title="Chưa có hoạt động mới" description="Khi học viên đăng nhập, học tập hoặc nộp bài, hoạt động sẽ xuất hiện tại đây." />
      )}

      {!loading && available && events.length > 0 && (
        <div className="mt-3 divide-y divide-[var(--app-color-divider)]">
          {events.slice(0, 12).map(event => (
            <button
              key={event.eventId}
              type="button"
              onClick={() => onSelect(event)}
              className="flex min-h-14 w-full items-start justify-between gap-3 py-3 text-left transition hover:bg-[var(--app-color-surface-soft)] focus:outline-none focus:ring-2 focus:ring-red-700/20"
            >
              <div className="min-w-0">
                <AppText weight="bold" truncate>{event.fullName || event.username || "Học viên"}</AppText>
                <AppCaption truncate>
                  {eventTypeLabel[event.eventType] || event.eventType}
                  {event.resourceTitle ? ` • ${event.resourceTitle}` : ""}
                </AppCaption>
                <AppCaption truncate>{event.unit || "Chưa xác định đơn vị"}</AppCaption>
              </div>
              <div className="shrink-0 text-right">
                <AppCaption>{formatTime(event.createdAt)}</AppCaption>
                {(event.score !== undefined || event.progressPercent !== undefined) && (
                  <AppCaption color="brand" className="font-bold">
                    {event.score !== undefined ? metricText(event.score) : metricText(event.progressPercent, "%")}
                  </AppCaption>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
