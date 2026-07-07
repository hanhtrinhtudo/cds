import React from "react";
import { X } from "lucide-react";
import { AppCaption, AppHeading, AppText, Badge, Button, EmptyState } from "../../ui";
import { DrillDownPanelProps } from "./dashboardTypes";
import { eventTypeLabel, formatTime, metricText } from "./dashboardUtils";

const readString = (value: unknown, key: string): string => {
  if (!value || typeof value !== "object") return "";
  const result = (value as Record<string, unknown>)[key];
  return typeof result === "string" ? result : "";
};

const learnerId = (learner: unknown) => readString(learner, "userId") || readString(learner, "id");
const learnerUnit = (learner: unknown) =>
  readString(learner, "unit") || readString(learner, "organizationName") || readString(learner, "unitId") || "Chưa xác định đơn vị";

export default function DrillDownPanel({ selection, events, onClose, onOpenLearner }: DrillDownPanelProps) {
  if (!selection) return null;

  const relatedEvents = events.filter(event => {
    if (selection.mode === "event") return event.eventId === selection.event?.eventId;
    if (selection.mode === "unit") return event.unit === selection.unit?.unit;
    if (selection.mode === "learner") return event.userId === learnerId(selection.learner);
    if (selection.mode === "kpi" && selection.kpiId === "submissions") return event.eventType === "QUIZ_SUBMIT";
    if (selection.mode === "kpi" && selection.kpiId === "learningToday") return ["OPEN_TOPIC", "READ_PROGRESS", "MARK_COMPLETE"].includes(event.eventType);
    if (selection.mode === "kpi" && selection.kpiId === "loggedInToday") return event.eventType === "LOGIN";
    return true;
  }).slice(0, 12);

  return (
    <aside className="fixed inset-x-0 bottom-0 z-[var(--app-z-modal)] max-h-[78dvh] overflow-y-auto rounded-t-[var(--app-radius-sheet)] bg-[var(--app-color-surface)] p-4 shadow-[var(--app-shadow-overlay)] ring-1 ring-[var(--app-color-border)] md:absolute md:inset-y-4 md:right-4 md:left-auto md:w-[380px] md:rounded-[var(--app-radius-card)]" id="drill-down-panel">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <AppCaption overline>Drill Down</AppCaption>
          <AppHeading level="h2" variant="title" truncate>{selection.title}</AppHeading>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onClose} aria-label="Đóng chi tiết"><X size={17} /></Button>
      </div>

      <div className="mt-4 space-y-3">
        {selection.mode === "unit" && selection.unit && (
          <div className="rounded-2xl bg-[var(--app-color-surface-soft)] p-3">
            <AppText weight="black">{selection.unit.unit}</AppText>
            <AppCaption>Hoạt động {metricText(selection.unit.activeUsers)}/{metricText(selection.unit.users)} • Hoàn thành {metricText(selection.unit.completionRate, "%")} • Điểm {metricText(selection.unit.averageScore)}</AppCaption>
          </div>
        )}

        {selection.mode === "learner" && selection.learner && (
          <div className="rounded-2xl bg-[var(--app-color-surface-soft)] p-3">
            <AppText weight="black">{selection.learner.fullName}</AppText>
            <AppCaption>{learnerUnit(selection.learner)}</AppCaption>
          </div>
        )}

        {selection.mode === "event" && selection.event && (
          <div className="rounded-2xl bg-[var(--app-color-surface-soft)] p-3">
            <div className="flex items-center justify-between gap-2">
              <AppText weight="black">{eventTypeLabel[selection.event.eventType] || selection.event.eventType}</AppText>
              <Badge variant="info">{formatTime(selection.event.createdAt)}</Badge>
            </div>
            <AppCaption>{selection.event.fullName || selection.event.username || "Học viên"} • {selection.event.unit || "Chưa xác định đơn vị"}</AppCaption>
            {selection.event.resourceTitle && <AppCaption color="brand" className="mt-1 font-bold">{selection.event.resourceTitle}</AppCaption>}
          </div>
        )}

        <div>
          <AppText weight="black">Hoạt động liên quan</AppText>
          {relatedEvents.length === 0 ? (
            <EmptyState className="mt-2" title="Chưa có hoạt động liên quan" description="Khi có dữ liệu phù hợp, danh sách sẽ hiển thị tại đây." />
          ) : (
            <div className="mt-2 divide-y divide-[var(--app-color-divider)] rounded-2xl bg-[var(--app-color-surface-soft)] px-3">
              {relatedEvents.map(event => (
                <button type="button" key={event.eventId} onClick={() => event.userId && onOpenLearner?.(event.userId)} disabled={!event.userId || !onOpenLearner} className="min-h-11 w-full py-3 text-left disabled:cursor-default">
                  <AppText weight="bold" truncate>{event.fullName || event.username || "Học viên"}</AppText>
                  <AppCaption truncate>{eventTypeLabel[event.eventType] || event.eventType}{event.resourceTitle ? ` • ${event.resourceTitle}` : ""}</AppCaption>
                  <AppCaption>{formatTime(event.createdAt)}</AppCaption>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-red-50/80 p-3">
          <AppText weight="black" color="brand">Gợi ý xử lý</AppText>
          <AppCaption>Kiểm tra dữ liệu chi tiết, đối chiếu tình hình đơn vị và lựa chọn hình thức nhắc học hoặc hỗ trợ phù hợp.</AppCaption>
        </div>
      </div>
    </aside>
  );
}
