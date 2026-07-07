import React from "react";
import { AlertTriangle } from "lucide-react";
import { AppCaption, AppHeading, AppText, Badge, EmptyState, Skeleton } from "../../ui";
import { CommandAlert } from "./dashboardTypes";

interface CommandAlertsPanelProps {
  loading: boolean;
  available: boolean;
  alerts: CommandAlert[];
  onSelect?: (alert: CommandAlert) => void;
}

const severityVariant = {
  info: "info",
  warning: "warning",
  danger: "danger"
} as const;

export default function CommandAlertsPanel({ loading, available, alerts, onSelect }: CommandAlertsPanelProps) {
  return (
    <section className="pixel-surface p-4" id="command-alerts-panel">
      <div className="flex items-center justify-between gap-3">
        <div>
          <AppHeading level="h2" variant="title">Cảnh báo</AppHeading>
          <AppCaption>Tín hiệu cần theo dõi để hỗ trợ học viên và đơn vị.</AppCaption>
        </div>
        <AlertTriangle size={18} className="text-orange-500" />
      </div>

      {loading && <div className="mt-3 space-y-3"><Skeleton variant="list" /><Skeleton variant="list" /></div>}
      {!loading && !available && <EmptyState className="mt-3" title="Kho phân tích chưa sẵn sàng" description="Chưa thể phát hiện cảnh báo từ dữ liệu học tập." />}
      {!loading && available && alerts.length === 0 && <EmptyState className="mt-3" title="Chưa đủ dữ liệu để phát hiện cảnh báo" description="Hệ thống sẽ hiển thị tín hiệu cần theo dõi khi có dữ liệu phù hợp." />}

      {!loading && available && alerts.length > 0 && (
        <div className="mt-3 space-y-2">
          {alerts.map(alert => (
            <button type="button" key={alert.id} onClick={() => onSelect?.(alert)} className="min-h-11 w-full rounded-2xl bg-[var(--app-color-surface-soft)] p-3 text-left focus:outline-none focus:ring-2 focus:ring-red-700/20">
              <div className="flex items-start justify-between gap-2">
                <AppText weight="black">{alert.title}</AppText>
                <Badge variant={severityVariant[alert.severity]}>{alert.severity === "danger" ? "Cần hỗ trợ" : alert.severity === "warning" ? "Cần theo dõi" : "Thông tin"}</Badge>
              </div>
              <AppCaption className="mt-1">{alert.description}</AppCaption>
              <AppCaption color="brand" className="mt-2 font-bold">{alert.recommendedAction}</AppCaption>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
