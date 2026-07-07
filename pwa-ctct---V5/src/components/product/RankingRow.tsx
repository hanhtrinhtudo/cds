import React from "react";
import { Badge, AppCaption, AppText } from "../ui";

export interface RankingRowProps {
  rank: number;
  fullName: string;
  unit?: string;
  score?: number | string;
  correct?: number;
  total?: number;
  submittedAt?: string;
  highlight?: boolean;
  compact?: boolean;
  badge?: string;
  completionRate?: number;
}

const rankClass = (rank: number) => {
  if (rank === 1) return "bg-[var(--app-color-brand-gold)] border-[var(--app-color-brand-gold)] text-red-950";
  if (rank === 2) return "bg-[var(--app-color-surface-soft)] border-[var(--app-color-border-strong)] text-[var(--app-color-text-primary)]";
  if (rank === 3) return "bg-[var(--app-color-warning)] border-[var(--app-color-warning)] text-white";
  return "bg-[var(--app-color-surface-soft)] border-[var(--app-color-border)] text-[var(--app-color-text-muted)]";
};

export function RankingRow({ rank, fullName, unit, score, correct, total, submittedAt, highlight, compact = false, badge, completionRate }: RankingRowProps) {
  return (
    <div className={[
      "app-card-compact flex min-h-14 items-center justify-between gap-2.5 text-xs transition",
      compact ? "p-2" : "p-2.5",
      highlight ? "bg-[var(--app-color-warning-soft)] font-bold" : "bg-white",
    ].filter(Boolean).join(" ")}>
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={`w-7 h-7 rounded-xl font-extrabold text-xs flex items-center justify-center shrink-0 border ${rankClass(rank)}`}>
          {rank}
        </span>
        <div className="w-8 h-8 rounded-full bg-[var(--brand-warm)] text-[var(--app-color-brand-primary)] border border-[var(--app-color-border)] font-extrabold text-caption flex items-center justify-center shrink-0">
          {fullName.split(" ").pop()?.substring(0, 2).toUpperCase() || "PT"}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <AppText variant="bodyS" weight="black" truncate className="text-[var(--app-color-text-primary)]">{fullName}</AppText>
            {highlight && <Badge variant="warning">Tôi</Badge>}
          </div>
          <AppCaption truncate className="text-[var(--app-color-text-muted)]">{[unit, badge, submittedAt].filter(Boolean).join(" · ")}</AppCaption>
        </div>
      </div>
      <div className="text-right shrink-0">
        <AppText variant="bodyS" weight="black" className="text-[var(--app-color-text-primary)]">{score ?? (typeof correct === "number" && typeof total === "number" ? `${correct}/${total}` : "—")}</AppText>
        {typeof completionRate === "number" && <AppCaption className="text-[var(--app-color-text-muted)]">Hoàn thành: {completionRate}%</AppCaption>}
      </div>
    </div>
  );
}

export default RankingRow;
