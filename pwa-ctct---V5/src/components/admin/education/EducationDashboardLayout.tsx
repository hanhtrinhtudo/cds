import React from "react";
import { AppCaption, AppHeading } from "../../ui";
import EducationDashboardHeader from "./EducationDashboardHeader";
import EducationEmptyState from "./EducationEmptyState";
import EducationKpiGrid from "./EducationKpiGrid";
import EducationRankingPanel from "./EducationRankingPanel";
import EducationRecentActivity from "./EducationRecentActivity";
import EducationTrendPanel from "./EducationTrendPanel";
import { EducationDashboardSpec } from "./educationTypes";

interface EducationDashboardLayoutProps {
  spec: EducationDashboardSpec;
}

export default function EducationDashboardLayout({ spec }: EducationDashboardLayoutProps) {
  return (
    <div className="space-y-4" id={`education-dashboard-${spec.id}`}>
      <EducationDashboardHeader spec={spec} />
      <EducationKpiGrid items={spec.kpis} />
      <EducationTrendPanel analyticsAvailable={spec.analyticsAvailable} items={spec.trends} />
      <EducationRankingPanel analyticsAvailable={spec.analyticsAvailable} items={spec.rankings} />
      <EducationRecentActivity analyticsAvailable={spec.analyticsAvailable} items={spec.activities} />
      <section className="rounded-[var(--app-radius-card)] bg-[var(--app-color-surface)] p-3 ring-1 ring-[var(--app-color-border)]">
        <AppHeading level="h2" variant="title">{spec.drillDownTitle}</AppHeading>
        <AppCaption className="mt-1">{spec.drillDownDescription}</AppCaption>
        <EducationEmptyState
          title={spec.emptyTitle}
          description={spec.emptyDescription}
          className="mt-3"
        />
      </section>
    </div>
  );
}
