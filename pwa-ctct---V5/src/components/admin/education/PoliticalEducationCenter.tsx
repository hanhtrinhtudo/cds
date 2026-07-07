import React, { useEffect, useMemo, useState } from "react";
import { Chip } from "../../ui";
import EducationDashboardLayout from "./EducationDashboardLayout";
import { EducationDashboardId } from "./educationTypes";
import { buildEducationDashboardSpecs } from "./educationUtils";
import { AdminPanelProps } from "../../AdminPanel";
import { apiClient } from "../../../services/apiClient";
import { analyticsService } from "../../../services/analyticsService";

type PoliticalEducationCenterProps = Pick<
  AdminPanelProps,
  "users" | "topics" | "exams" | "questions"
>;

type EducationRange = "today" | "7d" | "30d";

const tabLabels: Record<EducationDashboardId, string> = {
  learning: "Tiến độ học",
  exam: "Kiểm tra",
  review: "Ôn tập",
  ai: "AI Tutor",
  news: "Tin tức"
};

const rangeLabels: Array<{ id: EducationRange; label: string }> = [
  { id: "today", label: "Hôm nay" },
  { id: "7d", label: "7 ngày" },
  { id: "30d", label: "30 ngày" }
];

export default function PoliticalEducationCenter({
  users,
  topics,
  exams,
  questions
}: PoliticalEducationCenterProps) {
  const [active, setActive] = useState<EducationDashboardId>("learning");
  const [range, setRange] = useState<EducationRange>("7d");
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsAvailable, setAnalyticsAvailable] = useState(false);
  const [analyticsEvents, setAnalyticsEvents] = useState<any[]>([]);
  const [analyticsSummary, setAnalyticsSummary] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;

    const loadAnalytics = async () => {
      const token = apiClient.getAuthToken();

      if (!token) {
        setAnalyticsAvailable(false);
        setAnalyticsEvents([]);
        setAnalyticsSummary(null);
        return;
      }

      setAnalyticsLoading(true);

      try {
        const health = await analyticsService.health(token);

        if (!analyticsService.isSupported(health)) {
          if (!cancelled) {
            setAnalyticsAvailable(false);
            setAnalyticsEvents([]);
            setAnalyticsSummary(null);
          }
          return;
        }

        const [summary, events] = await Promise.all([
          analyticsService.getAdminSummary(token, { range }),
          analyticsService.adminListEvents(token, { range, limit: 200 })
        ]);

        if (!cancelled) {
          setAnalyticsAvailable(true);
          setAnalyticsSummary(summary);
          setAnalyticsEvents(Array.isArray(events) ? events : []);
        }
      } catch {
        if (!cancelled) {
          setAnalyticsAvailable(false);
          setAnalyticsEvents([]);
          setAnalyticsSummary(null);
        }
      } finally {
        if (!cancelled) setAnalyticsLoading(false);
      }
    };

    void loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, [range]);

  const specs = useMemo(
    () =>
      buildEducationDashboardSpecs({
        users,
        topics,
        exams,
        questions,
        analyticsLoading,
        analyticsAvailable,
        analyticsEvents,
        analyticsSummary,
        range
      }),
    [
      users,
      topics,
      exams,
      questions,
      analyticsLoading,
      analyticsAvailable,
      analyticsEvents,
      analyticsSummary,
      range
    ]
  );

  const activeSpec = specs.find(spec => spec.id === active) || specs[0];

  return (
    <section className="space-y-4" id="political-education-center">
      <div className="space-y-2">
        <div
          className="no-scrollbar flex gap-2 overflow-x-auto pb-1"
          aria-label="Điều hướng Giáo dục chính trị"
        >
          {specs.map(spec => (
            <Chip
              key={spec.id}
              selected={active === spec.id}
              onClick={() => setActive(spec.id)}
              aria-current={active === spec.id ? "page" : undefined}
            >
              {tabLabels[spec.id]}
            </Chip>
          ))}
        </div>

        <div
          className="no-scrollbar flex gap-2 overflow-x-auto pb-1"
          aria-label="Khoảng thời gian phân tích"
        >
          {rangeLabels.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setRange(item.id)}
              className={`min-h-11 shrink-0 rounded-xl px-3 text-sm font-extrabold ${
                range === item.id
                  ? "bg-[var(--app-color-brand-primary)] text-white"
                  : "border border-[var(--app-color-border)] bg-[var(--app-color-surface)] text-[var(--app-color-text-secondary)]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <EducationDashboardLayout spec={activeSpec} />
    </section>
  );
}