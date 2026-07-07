import React from "react";
import { AnalyticsSummary } from "../../services/analyticsService";
import { AppCaption, AppHeading } from "../ui";

export default function AdminUnitAnalytics({ units = [] }: { units?: NonNullable<AnalyticsSummary["units"]> }) {
  return (
    <section className="pixel-surface p-4" aria-label="Tiến độ đơn vị">
      <AppHeading level="h3" variant="title">Tiến độ đơn vị</AppHeading>
      {units.length ? (
        <div className="mt-3 space-y-2">
          {units.slice(0, 5).map(unit => (
            <div key={unit.unit} className="rounded-xl bg-[var(--app-color-surface-soft)] p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate font-bold">{unit.unit || "Chưa xác định"}</span>
                <span className="shrink-0 font-extrabold text-[var(--app-color-brand-primary)]">{unit.completionRate}%</span>
              </div>
              <AppCaption>{unit.activeUsers}/{unit.users} hoạt động · Điểm TB {unit.averageScore}</AppCaption>
            </div>
          ))}
        </div>
      ) : (
        <AppCaption className="mt-3 block leading-relaxed">Chưa có dữ liệu tiến độ theo đơn vị.</AppCaption>
      )}
    </section>
  );
}
