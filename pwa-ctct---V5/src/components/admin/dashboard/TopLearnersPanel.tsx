import React from "react";
import { Medal } from "lucide-react";
import { AppCaption, AppHeading, AppText, EmptyState, Skeleton } from "../../ui";
import { LearnerSignal } from "./dashboardTypes";
import { formatTime, metricText } from "./dashboardUtils";

interface TopLearnersPanelProps {
  loading: boolean;
  available: boolean;
  learners: LearnerSignal[];
  onSelect: (learner: LearnerSignal) => void;
}

export default function TopLearnersPanel({ loading, available, learners, onSelect }: TopLearnersPanelProps) {
  const ranked = learners
    .filter(item => item.peqi !== undefined || item.completedTopics !== undefined || item.averageScore !== undefined || item.activityCount > 0)
    .sort((a, b) => Number(b.peqi ?? b.completedTopics ?? b.averageScore ?? b.activityCount ?? 0) - Number(a.peqi ?? a.completedTopics ?? a.averageScore ?? a.activityCount ?? 0))
    .slice(0, 6);

  return (
    <section className="pixel-surface p-4" id="top-learners-panel">
      <div className="flex items-center justify-between gap-3">
        <div>
          <AppHeading level="h2" variant="title">Top học viên</AppHeading>
          <AppCaption>Xếp hạng theo PEQI, tiến độ, điểm số hoặc hoạt động học tập.</AppCaption>
        </div>
        <Medal size={18} className="text-amber-500" />
      </div>

      {loading && <div className="mt-3 space-y-3"><Skeleton variant="list" /><Skeleton variant="list" /></div>}
      {!loading && !available && <EmptyState className="mt-3" title="Kho phân tích chưa sẵn sàng" description="Chưa thể xếp hạng học viên." />}
      {!loading && available && ranked.length === 0 && <EmptyState className="mt-3" title="Chưa có tín hiệu xếp hạng học viên" description="Cần thêm hoạt động học tập, kết quả hoặc PEQI để hiển thị." />}

      {!loading && available && ranked.length > 0 && (
        <div className="mt-3 space-y-2">
          {ranked.map((learner, index) => (
            <button key={learner.userId} type="button" onClick={() => onSelect(learner)} className="flex min-h-14 w-full items-center gap-3 rounded-2xl bg-[var(--app-color-surface-soft)] p-3 text-left hover:bg-red-50/60 focus:outline-none focus:ring-2 focus:ring-red-700/20">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white font-extrabold text-[var(--app-color-brand-primary)]">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <AppText weight="black" truncate>{learner.fullName}</AppText>
                <AppCaption truncate>{learner.unit || "Chưa xác định đơn vị"} • PEQI {metricText(learner.peqi)} • Điểm {metricText(learner.averageScore)}</AppCaption>
              </div>
              <AppCaption className="shrink-0 text-right">{formatTime(learner.latestActivity)}</AppCaption>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
