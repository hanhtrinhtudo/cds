import React from "react";

export type EducationDashboardId = "learning" | "exam" | "review" | "ai" | "news";

export type EducationMetricTone = "neutral" | "good" | "warning" | "danger" | "info";

export interface EducationKpi {
  id: string;
  label: string;
  value?: string | number | null;
  helper?: string;
  tone?: EducationMetricTone;
}

export interface EducationTrendCard {
  id: string;
  title: string;
  description: string;
  value?: string | number | null;
  tone?: EducationMetricTone;
}

export interface EducationRankingItem {
  id: string;
  rank: number;
  title: string;
  subtitle?: string;
  metric?: string;
  tone?: EducationMetricTone;
}

export interface EducationActivityItem {
  id: string;
  time?: string;
  title: string;
  description?: string;
  tone?: EducationMetricTone;
}

export interface EducationDashboardSpec {
  id: EducationDashboardId;
  title: string;
  subtitle: string;
  badge: string;
  analyticsAvailable: boolean;
  kpis: EducationKpi[];
  trends: EducationTrendCard[];
  rankings: EducationRankingItem[];
  activities: EducationActivityItem[];
  drillDownTitle: string;
  drillDownDescription: string;
  emptyTitle: string;
  emptyDescription: string;
  icon: React.ReactNode;
}
