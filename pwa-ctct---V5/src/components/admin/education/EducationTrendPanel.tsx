import React from "react";
import { AppCaption, AppHeading, AppText, Badge } from "../../ui";
import EducationEmptyState from "./EducationEmptyState";
import { EducationTrendCard } from "./educationTypes";

interface EducationTrendPanelProps {
  title?: string;
  analyticsAvailable: boolean;
  items: EducationTrendCard[];
}

const toneVariant = {
  neutral: "neutral",
  good: "success",
  warning: "warning",
  danger: "danger",
  info: "info"
} as const;

export default function EducationTrendPanel({ title = "Xu hướng và chuyên mục", analyticsAvailable, items }: EducationTrendPanelProps) {
  return (
    <section className="space-y-2">
      <AppHeading level="h2" variant="title">{title}</AppHeading>
      {!analyticsAvailable ? (
        <EducationEmptyState title="No analytics available" description="Chưa thể hiển thị xu hướng khi kho phân tích chưa sẵn sàng." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map(item => (
            <article key={item.id} className="rounded-[var(--app-radius-card)] bg-[var(--app-color-surface)] p-3 ring-1 ring-[var(--app-color-border)]">
              <div className="flex items-start justify-between gap-2">
                <AppText weight="black">{item.title}</AppText>
                <Badge variant={toneVariant[item.tone || "neutral"]}>{item.value ?? "--"}</Badge>
              </div>
              <AppCaption className="mt-1">{item.description}</AppCaption>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
