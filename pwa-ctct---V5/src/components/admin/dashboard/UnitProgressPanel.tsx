import React from "react";
import { AppCaption, AppHeading, AppText, Badge, EmptyState, Skeleton } from "../../ui";
import { UnitProgressItem } from "./dashboardTypes";
import { metricText, toneBadgeVariant, unitStatus } from "./dashboardUtils";

interface UnitProgressPanelProps {
  loading: boolean;
  available: boolean;
  units: UnitProgressItem[];
  onSelect: (unit: UnitProgressItem) => void;
}

export default function UnitProgressPanel({ loading, available, units, onSelect }: UnitProgressPanelProps) {
  return (
    <section className="pixel-surface p-4" id="unit-progress-panel">
      <div>
        <AppHeading level="h2" variant="title">Tiến độ đơn vị</AppHeading>
        <AppCaption>Tổng hợp hoạt động, hoàn thành và kết quả theo đơn vị.</AppCaption>
      </div>

      {loading && <div className="mt-3 space-y-3"><Skeleton variant="list" /><Skeleton variant="list" /><Skeleton variant="list" /></div>}
      {!loading && !available && <EmptyState className="mt-3" title="Kho phân tích chưa sẵn sàng" description="Chưa thể tổng hợp tiến độ theo đơn vị." />}
      {!loading && available && units.length === 0 && <EmptyState className="mt-3" title="Chưa có dữ liệu tiến độ theo đơn vị" description="Dữ liệu sẽ xuất hiện sau khi học viên có hoạt động học tập." />}

      {!loading && available && units.length > 0 && (
        <div className="mt-3 space-y-3">
          {units.slice(0, 6).map(unit => {
            const status = unitStatus(unit);
            const completion = Math.max(0, Math.min(100, Number(unit.completionRate || 0)));
            return (
              <button
                key={unit.unit}
                type="button"
                onClick={() => onSelect(unit)}
                className="w-full rounded-2xl bg-[var(--app-color-surface-soft)] p-3 text-left transition hover:bg-red-50/60 focus:outline-none focus:ring-2 focus:ring-red-700/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <AppText weight="black" truncate>{unit.unit}</AppText>
                    <AppCaption>{metricText(unit.activeUsers)}/{metricText(unit.users)} đang hoạt động • Điểm TB {metricText(unit.averageScore)}</AppCaption>
                  </div>
                  <Badge variant={toneBadgeVariant(status.tone)}>{status.label}</Badge>
                </div>
                {unit.completionRate !== undefined ? (
                  <div className="mt-3">
                    <div className="h-2 overflow-hidden rounded-full bg-white">
                      <div className="h-full rounded-full bg-[var(--app-color-brand-primary)]" style={{ width: `${completion}%` }} />
                    </div>
                    <AppCaption className="mt-1 font-bold">Hoàn thành {metricText(unit.completionRate, "%")} • PEQI {metricText(unit.peqiAverage)}</AppCaption>
                  </div>
                ) : (
                  <AppCaption className="mt-2">Chưa có tín hiệu hoàn thành.</AppCaption>
                )}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
