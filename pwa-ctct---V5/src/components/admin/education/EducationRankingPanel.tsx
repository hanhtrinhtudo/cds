import React from "react";
import { AppCaption, AppHeading, AppText, Badge } from "../../ui";
import EducationEmptyState from "./EducationEmptyState";
import { EducationRankingItem } from "./educationTypes";

interface EducationRankingPanelProps {
  title?: string;
  analyticsAvailable: boolean;
  items: EducationRankingItem[];
}

export default function EducationRankingPanel({ title = "Xếp hạng", analyticsAvailable, items }: EducationRankingPanelProps) {
  return (
    <section className="space-y-2">
      <AppHeading level="h2" variant="title">{title}</AppHeading>
      {!analyticsAvailable || items.length === 0 ? (
        <EducationEmptyState title="Chưa có dữ liệu xếp hạng" description="Bảng xếp hạng sẽ hiển thị khi có đủ dữ liệu phân tích hợp lệ." />
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <article key={item.id} className="flex min-h-14 items-center gap-3 rounded-2xl bg-[var(--app-color-surface)] p-3 ring-1 ring-[var(--app-color-border)]">
              <Badge variant="neutral">#{item.rank}</Badge>
              <div className="min-w-0 flex-1">
                <AppText weight="black" truncate>{item.title}</AppText>
                {item.subtitle && <AppCaption truncate>{item.subtitle}</AppCaption>}
              </div>
              <AppCaption className="shrink-0 font-extrabold">{item.metric || "--"}</AppCaption>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
