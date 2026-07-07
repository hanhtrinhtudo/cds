import React from "react";
import { AppCaption, AppHeading, AppText } from "../../ui";
import EducationEmptyState from "./EducationEmptyState";
import { EducationActivityItem } from "./educationTypes";

interface EducationRecentActivityProps {
  analyticsAvailable: boolean;
  items: EducationActivityItem[];
}

export default function EducationRecentActivity({ analyticsAvailable, items }: EducationRecentActivityProps) {
  return (
    <section className="space-y-2">
      <AppHeading level="h2" variant="title">Hoạt động gần đây</AppHeading>
      {!analyticsAvailable || items.length === 0 ? (
        <EducationEmptyState title="Chưa có hoạt động gần đây" description="Hoạt động sẽ xuất hiện khi analytics ghi nhận sự kiện phù hợp." />
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <article key={item.id} className="rounded-2xl bg-[var(--app-color-surface)] p-3 ring-1 ring-[var(--app-color-border)]">
              <div className="flex items-start justify-between gap-2">
                <AppText weight="black">{item.title}</AppText>
                {item.time && <AppCaption className="shrink-0">{item.time}</AppCaption>}
              </div>
              {item.description && <AppCaption className="mt-1">{item.description}</AppCaption>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
