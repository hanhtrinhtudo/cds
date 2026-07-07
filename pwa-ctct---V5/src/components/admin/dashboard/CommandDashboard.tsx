import React, { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { analyticsService, AnalyticsEventRecord, AnalyticsSummary } from "../../../services/analyticsService";
import { apiClient } from "../../../services/apiClient";
import { User, UserRole } from "../../../types";
import { Alert, AppCaption, AppHeading, Button, Chip } from "../../ui";
import { AdminCommandSection } from "../AdminCommandNav";
import CommandAlertsPanel from "./CommandAlertsPanel";
import CommandKpiGrid from "./CommandKpiGrid";
import DrillDownPanel from "./DrillDownPanel";
import QuickActionsPanel from "./QuickActionsPanel";
import RealtimeActivityFeed from "./RealtimeActivityFeed";
import TopLearnersPanel from "./TopLearnersPanel";
import TopUnitsPanel from "./TopUnitsPanel";
import UnitProgressPanel from "./UnitProgressPanel";
import { CommandDashboardFilters, DrillDownSelection, UnitProgressItem } from "./dashboardTypes";
import { deriveAlerts, deriveKpis, deriveLearners } from "./dashboardUtils";

export interface CommandDashboardProps {
  users: User[];
  onNavigateSection: (section: AdminCommandSection) => void;
  onOpenLearner?: (userId: string) => void;
  onOpenEvent?: (eventId: string, userId?: string) => void;
  onOpenRisk?: (riskId: string) => void;
}

const rangeOptions: Array<{ value: CommandDashboardFilters["range"]; label: string }> = [
  { value: "today", label: "Hôm nay" },
  { value: "7d", label: "7 ngày" },
  { value: "30d", label: "30 ngày" }
];

const emptySummary: AnalyticsSummary = {};

export default function CommandDashboard({ users, onNavigateSection, onOpenLearner, onOpenEvent, onOpenRisk }: CommandDashboardProps) {
  const [filters, setFilters] = useState<CommandDashboardFilters>({ range: "today", unit: "all" });
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<AnalyticsSummary>(emptySummary);
  const [events, setEvents] = useState<AnalyticsEventRecord[]>([]);
  const [selection, setSelection] = useState<DrillDownSelection | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const token = apiClient.getAuthToken();
      setLoading(true);
      setError(null);

      if (!token) {
        if (!cancelled) {
          setAvailable(false);
          setLoading(false);
        }
        return;
      }

      try {
        const health = await analyticsService.health(token);
        if (!analyticsService.isSupported(health)) {
          if (!cancelled) {
            setAvailable(false);
            setSummary(emptySummary);
            setEvents([]);
          }
          return;
        }

        const requestFilters = {
          range: filters.range,
          unit: filters.unit === "all" ? undefined : filters.unit,
          eventType: filters.eventType,
          query: filters.search,
          limit: 100
        };

        const [nextSummary, nextEvents] = await Promise.all([
          analyticsService.getAdminSummary(token, requestFilters),
          analyticsService.adminListEvents(token, requestFilters)
        ]);

        if (!cancelled) {
          setSummary(nextSummary || emptySummary);
          setEvents(Array.isArray(nextEvents) ? nextEvents : []);
          setAvailable(true);
        }
      } catch {
        if (!cancelled) {
          setAvailable(false);
          setError("Không thể tải dữ liệu chỉ huy. Vui lòng thử lại.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [filters.range, filters.unit, filters.eventType, filters.search, reloadKey]);

  const units = useMemo<UnitProgressItem[]>(() => summary.units || [], [summary.units]);
  const learners = useMemo(() => deriveLearners(events, users.filter(user => user.role === UserRole.MEMBER)), [events, users]);
  const kpis = useMemo(() => deriveKpis(summary, available), [summary, available]);
  const alerts = useMemo(() => deriveAlerts(summary, units, learners, available), [summary, units, learners, available]);

  const unitOptions = useMemo(() => {
    const names = new Set<string>();
    units.forEach(unit => { if (unit.unit) names.add(unit.unit); });
    events.forEach(event => { if (event.unit) names.add(event.unit); });
    return Array.from(names).sort((a, b) => a.localeCompare(b, "vi"));
  }, [events, units]);

  const openUnit = (unit: UnitProgressItem) => {
    setFilters(current => ({ ...current, unit: unit.unit || "all" }));
    setSelection({ mode: "unit", title: `Đơn vị: ${unit.unit}`, unit });
  };

  return (
    <div className="relative space-y-4" id="command-dashboard">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <AppCaption overline>Dashboard chỉ huy</AppCaption>
          <AppHeading level="h1" variant="headingL">Tổng quan chỉ huy</AppHeading>
          <AppCaption>Tình hình học tập, ôn luyện và kết quả giáo dục chính trị theo phạm vi quản lý.</AppCaption>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={() => setReloadKey(key => key + 1)} leftIcon={<RefreshCw size={16} />}>
          Làm mới
        </Button>
      </div>

      <section className="pixel-surface p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {rangeOptions.map(option => (
              <Chip key={option.value} selected={filters.range === option.value} onClick={() => setFilters(current => ({ ...current, range: option.value }))}>
                {option.label}
              </Chip>
            ))}
          </div>
          <label className="flex min-h-11 items-center gap-2 rounded-2xl bg-[var(--app-color-surface-soft)] px-3">
            <AppCaption as="span" className="font-bold">Đơn vị</AppCaption>
            <select
              value={filters.unit}
              onChange={event => setFilters(current => ({ ...current, unit: event.target.value }))}
              className="min-h-11 bg-transparent text-bodyS font-bold outline-none"
            >
              <option value="all">Tất cả</option>
              {unitOptions.map(unit => <option key={unit} value={unit}>{unit}</option>)}
            </select>
          </label>
        </div>
      </section>

      {error && <Alert variant="warning" title="Dữ liệu chỉ huy tạm thời chưa tải được" description={error} />}

      <CommandKpiGrid
        loading={loading}
        available={available}
        kpis={kpis}
        onSelect={kpi => setSelection({ mode: "kpi", title: kpi.label, kpiId: kpi.id })}
      />

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <RealtimeActivityFeed
          loading={loading}
          available={available}
          events={events}
          onSelect={event => event.userId && onOpenLearner ? onOpenLearner(event.userId) : onOpenEvent ? onOpenEvent(event.eventId, event.userId) : setSelection({ mode: "event", title: "Chi tiết hoạt động", event })}
        />
        <UnitProgressPanel loading={loading} available={available} units={units} onSelect={openUnit} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <TopUnitsPanel loading={loading} available={available} units={units} onSelect={openUnit} />
        <TopLearnersPanel
          loading={loading}
          available={available}
          learners={learners}
          onSelect={learner => onOpenLearner ? onOpenLearner(learner.userId) : setSelection({ mode: "learner", title: `Học viên: ${learner.fullName}`, learner })}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <CommandAlertsPanel loading={loading} available={available} alerts={alerts} onSelect={alert => onOpenRisk ? onOpenRisk(alert.id) : setSelection({ mode: "kpi", title: alert.title, kpiId: alert.id })} />
        <QuickActionsPanel onNavigate={onNavigateSection} />
      </div>

      <DrillDownPanel selection={selection} events={events} onClose={() => setSelection(null)} onOpenLearner={onOpenLearner} />
    </div>
  );
}
