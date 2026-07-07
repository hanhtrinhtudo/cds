import React from "react";
import { Trophy } from "lucide-react";
import { AppCaption, AppHeading, AppText, EmptyState, Skeleton } from "../../ui";
import { UnitProgressItem } from "./dashboardTypes";
import { metricText } from "./dashboardUtils";

interface TopUnitsPanelProps {
  loading: boolean;
  available: boolean;
  units: UnitProgressItem[];
  onSelect: (unit: UnitProgressItem) => void;
}

export default function TopUnitsPanel({ loading, available, units, onSelect }: TopUnitsPanelProps) {
  const ranked = [...units]
    .filter(unit => unit.peqiAverage !== undefined || unit.completionRate !== undefined || unit.averageScore !== undefined || unit.activeUsers !== undefined)
    .sort((a, b) => Number(b.peqiAverage ?? b.completionRate ?? b.averageScore ?? b.activeUsers ?? 0) - Number(a.peqiAverage ?? a.completionRate ?? a.averageScore ?? a.activeUsers ?? 0))
    .slice(0, 5);

  return (
    <section className="pixel-surface p-4" id="top-units-panel">
      <div className="flex items-center justify-between gap-3">
        <div>
          <AppHeading level="h2" variant="title">Top đơn vị</AppHeading>
          <AppCaption>Xếp hạng theo PEQI, tiến độ hoặc tín hiệu hoạt động có sẵn.</AppCaption>
        </div>
        <Trophy size={18} className="text-amber-500" />
      </div>

      {loading && <div className="mt-3 space-y-3"><Skeleton variant="list" /><Skeleton variant="list" /></div>}
      {!loading && !available && <EmptyState className="mt-3" title="Kho phân tích chưa sẵn sàng" description="Chưa thể xếp hạng đơn vị." />}
      {!loading && available && ranked.length === 0 && <EmptyState className="mt-3" title="Chưa có dữ liệu xếp hạng đơn vị" description="Cần thêm tín hiệu PEQI, tiến độ hoặc điểm số để xếp hạng." />}

      {!loading && available && ranked.length > 0 && (
        <div className="mt-3 space-y-2">
          {ranked.map((unit, index) => (
            <button key={unit.unit} type="button" onClick={() => onSelect(unit)} className="flex min-h-14 w-full items-center gap-3 rounded-2xl bg-[var(--app-color-surface-soft)] p-3 text-left hover:bg-red-50/60 focus:outline-none focus:ring-2 focus:ring-red-700/20">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white font-extrabold text-[var(--app-color-brand-primary)]">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <AppText weight="black" truncate>{unit.unit}</AppText>
                <AppCaption truncate>PEQI {metricText(unit.peqiAverage)} • Hoàn thành {metricText(unit.completionRate, "%")} • Điểm {metricText(unit.averageScore)}</AppCaption>
              </div>
              <AppCaption className="shrink-0 font-bold">{metricText(unit.activeUsers)}</AppCaption>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
