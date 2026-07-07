import React from "react";
import { AppCaption, AppHeading, Badge } from "../../ui";
import { EducationDashboardSpec } from "./educationTypes";

interface EducationDashboardHeaderProps {
  spec: EducationDashboardSpec;
}

export default function EducationDashboardHeader({ spec }: EducationDashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-3 rounded-[var(--app-radius-card)] bg-[var(--app-color-surface)] p-3 ring-1 ring-[var(--app-color-border)] md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-[var(--app-color-brand-primary)]">
          {spec.icon}
        </div>
        <div className="min-w-0">
          <AppCaption overline>Giáo dục chính trị</AppCaption>
          <AppHeading level="h1" variant="headingL" className="leading-tight">
            {spec.title}
          </AppHeading>
          <AppCaption className="mt-1">{spec.subtitle}</AppCaption>
        </div>
      </div>
      <Badge variant={spec.analyticsAvailable ? "success" : "warning"} className="w-fit shrink-0">
        {spec.analyticsAvailable ? "Dữ liệu sẵn sàng" : spec.badge}
      </Badge>
    </div>
  );
}
