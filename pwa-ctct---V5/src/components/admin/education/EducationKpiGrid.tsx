import React from "react";
import { AppCaption, AppText, Badge, Skeleton } from "../../ui";
import { EducationKpi } from "./educationTypes";

interface EducationKpiGridProps {
  loading?: boolean;
  items: EducationKpi[];
}

const toneVariant = {
  neutral: "neutral",
  good: "success",
  warning: "warning",
  danger: "danger",
  info: "info"
} as const;

export default function EducationKpiGrid({ loading = false, items }: EducationKpiGridProps) {
  if (loading) {
    return (
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Đang tải chỉ số giáo dục">
        {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} variant="card" />)}
      </section>
    );
  }

  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Chỉ số giáo dục">
      {items.map(item => (
        <article key={item.id} className="min-h-[106px] rounded-[var(--app-radius-card)] bg-[var(--app-color-surface)] p-3 ring-1 ring-[var(--app-color-border)]">
          <div className="mb-2 flex items-start justify-between gap-2">
            <AppCaption className="font-bold leading-snug">{item.label}</AppCaption>
            <Badge variant={toneVariant[item.tone || "neutral"]}>{item.tone === "good" ? "Tốt" : "Theo dõi"}</Badge>
          </div>
          <AppText as="div" variant="headingM" weight="black" className="leading-none">
            {item.value === null || item.value === undefined || item.value === "" ? "--" : item.value}
          </AppText>
          {item.helper && <AppCaption className="mt-2 text-[var(--app-color-text-muted)]">{item.helper}</AppCaption>}
        </article>
      ))}
    </section>
  );
}
