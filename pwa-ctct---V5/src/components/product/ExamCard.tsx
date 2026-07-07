import React from "react";
import { ChevronRight } from "lucide-react";
import { Badge, Button, Card, Select, AppCaption, AppText } from "../ui";

export type ExamCardMode = "mock" | "exam" | "practice" | "unknown";
export type ExamCardStatus = "active" | "scheduled" | "completed" | "closed" | "unavailable";

export interface ExamTargetOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ExamCardProps {
  title: string;
  description?: string;
  mode: ExamCardMode;
  status: ExamCardStatus;
  statusLabel?: string;
  durationMinutes?: number;
  questionCount?: number;
  timeWindowLabel?: string;
  targetAudienceLabel?: string;
  selectedTarget?: string;
  targetOptions?: ExamTargetOption[];
  onTargetChange?: (value: string) => void;
  onStart?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  loading?: boolean;
  disabled?: boolean;
  resultSummary?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

const statusVariant = {
  active: "success",
  scheduled: "pending",
  completed: "completed",
  closed: "expired",
  unavailable: "neutral"
} as const;

const defaultStatusLabel = {
  active: "Đang diễn ra",
  scheduled: "Sắp diễn ra",
  completed: "Hoàn thành",
  closed: "Đã kết thúc",
  unavailable: "Chưa diễn ra"
} as const;

const modeLabel = {
  mock: "Bắt đầu thi thử",
  exam: "Bắt đầu kiểm tra",
  practice: "Bắt đầu luyện tập",
  unknown: "Bắt đầu kiểm tra"
} as const;

const displayTargetLabel = (label: string) => {
  const normalized = label.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (["sq", "siquan"].includes(normalized)) return "SQ";
  if (normalized === "qncn") return "QNCN";
  if (["dqtv", "danquantuve"].includes(normalized)) return "DQTV";
  if (["all", "cbqncn", "canboqncn", "canbo"].includes(normalized)) return "CB, QNCN";
  return label.replace(/\s*\(\d+\s*câu\)\s*$/i, "").trim();
};

export function ExamCard({
  title,
  description,
  mode,
  status,
  statusLabel,
  durationMinutes,
  questionCount,
  timeWindowLabel,
  targetAudienceLabel,
  selectedTarget = "",
  targetOptions = [],
  onTargetChange,
  onStart,
  loading = false,
  disabled = false,
  resultSummary,
  footer,
  className = ""
}: ExamCardProps) {
  const canStart = status === "active" && !disabled;
  const metricText = [
    durationMinutes ? `${durationMinutes} phút` : "",
    typeof questionCount === "number" ? `${questionCount} câu` : ""
  ].filter(Boolean).join(" · ");

  return (
    <Card variant="default" className={["space-y-2.5 p-3", className].filter(Boolean).join(" ")}>
      <div className="flex justify-between gap-2">
        <Badge variant={statusVariant[status]}>{statusLabel || defaultStatusLabel[status]}</Badge>
        {metricText && <AppCaption className="font-bold text-[var(--app-color-text-muted)]">{metricText}</AppCaption>}
      </div>

      <div>
        <AppText variant="bodyS" weight="black" className="text-[var(--app-color-text-primary)]">{title}</AppText>
        {description && <AppCaption className="mt-1 text-[var(--app-color-text-secondary)]">{description}</AppCaption>}
        {timeWindowLabel && <AppCaption className="mt-1 text-[var(--app-color-text-secondary)]">{timeWindowLabel}</AppCaption>}
        {targetAudienceLabel && <AppCaption className="mt-1 text-[var(--app-color-text-secondary)]">Đối tượng: {displayTargetLabel(targetAudienceLabel)}</AppCaption>}
      </div>

      {targetOptions.length > 0 && onTargetChange && (
        <Select
          label="Đối tượng"
          value={selectedTarget}
          onChange={onTargetChange}
          options={targetOptions.map(option => ({ ...option, label: displayTargetLabel(option.label) }))}
        />
      )}

      <div className="pt-1 flex justify-end">
        {resultSummary || footer || (
          canStart ? (
            <Button
              type="button"
              size="sm"
              loading={loading}
              disabled={disabled}
              onClick={onStart}
              rightIcon={<ChevronRight size={12} />}
            >
              {modeLabel[mode]}
            </Button>
          ) : (
            <AppCaption className="font-bold text-[var(--app-color-text-muted)]">Kỳ kiểm tra hiện chưa diễn ra</AppCaption>
          )
        )}
      </div>
    </Card>
  );
}

export default ExamCard;
