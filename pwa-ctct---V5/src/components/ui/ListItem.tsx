import React from "react";
import { AppCaption } from "./AppCaption";
import { AppText } from "./AppText";

export interface ListItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  interactive?: boolean;
  compact?: boolean;
}

export function ListItem({ title, subtitle, meta, leading, trailing, interactive = false, compact = false, className = "", ...props }: ListItemProps) {
  return (
    <div
      {...props}
      className={[
        "motion-list-item flex items-center gap-2.5 app-interactive-item",
        compact ? "p-2" : "p-2.5",
        interactive ? "cursor-pointer" : "",
        className
      ].filter(Boolean).join(" ")}
    >
      {leading && <div className="shrink-0">{leading}</div>}
      <div className="min-w-0 flex-1">
        <AppText variant="bodyS" weight="black" truncate className="text-[var(--app-color-text-primary)]">{title}</AppText>
        {subtitle && <AppCaption truncate className="mt-0.5 text-[var(--app-color-text-secondary)]">{subtitle}</AppCaption>}
        {meta && <AppCaption truncate className="mt-0.5 text-[var(--app-color-text-muted)]">{meta}</AppCaption>}
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  );
}

export default ListItem;
