import React from "react";
import { Activity, AlertTriangle, Award, BookOpenCheck, ClipboardCheck, Gauge, LogIn, TrendingDown } from "lucide-react";
import { AppCaption, AppText, Badge, EmptyState, Skeleton } from "../../ui";
import { CommandKpi } from "./dashboardTypes";
import { metricText, toneBadgeVariant } from "./dashboardUtils";

interface CommandKpiGridProps {
  loading: boolean;
  available: boolean;
  kpis: CommandKpi[];
  onSelect: (kpi: CommandKpi) => void;
}

const iconById: Record<string, React.ComponentType<{ size?: number }>> = {
  loggedInToday: LogIn,
  learningToday: Activity,
  completedToday: BookOpenCheck,
  submissions: ClipboardCheck,
  averageScore: Gauge,
  weakLearners: AlertTriangle,
  slowUnits: TrendingDown,
  peqiAverage: Award
};

export default function CommandKpiGrid({ loading, available, kpis, onSelect }: CommandKpiGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" id="command-kpi-grid" aria-label="Đang tải chỉ số">
        {Array.from({ length: 8 }, (_, index) => <Skeleton key={index} variant="card" />)}
      </div>
    );
  }

  if (!available) {
    return (
      <div id="command-kpi-grid" aria-label="Chỉ số chỉ huy">
        <EmptyState
          title="Kho phân tích chưa sẵn sàng"
          description="Các chỉ số chỉ huy sẽ hiển thị khi dữ liệu phân tích được kích hoạt."
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" id="command-kpi-grid">
      {kpis.map(kpi => {
        const Icon = iconById[kpi.id] || Gauge;
        return (
          <button
            key={kpi.id}
            type="button"
            onClick={() => onSelect(kpi)}
            className="motion-card min-h-[118px] rounded-[var(--app-radius-card)] bg-[var(--app-color-surface)] p-3 text-left shadow-[var(--app-shadow-subtle)] ring-1 ring-[var(--app-color-border)] transition hover:bg-[var(--app-color-surface-soft)] focus:outline-none focus:ring-2 focus:ring-red-700/25"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-[var(--app-color-brand-primary)]">
                <Icon size={18} />
              </span>
              <Badge variant={toneBadgeVariant(kpi.tone)}>{kpi.trend || "Theo dõi"}</Badge>
            </div>
            <AppText as="div" variant="headingM" weight="black" className="leading-none">
              {metricText(kpi.value)}
            </AppText>
            <AppCaption className="mt-1 font-bold leading-snug">{kpi.label}</AppCaption>
          </button>
        );
      })}
    </div>
  );
}
