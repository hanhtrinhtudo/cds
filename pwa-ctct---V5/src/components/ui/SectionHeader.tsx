import React from "react";
import { AppCaption } from "./AppCaption";
import { AppHeading } from "./AppHeading";

export interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
  className?: string;
}

export function SectionHeader({ title, description, action, compact = false, className = "" }: SectionHeaderProps) {
  return (
    <div className={["flex items-start justify-between gap-3", compact ? "pb-0" : "pb-1", className].filter(Boolean).join(" ")}>
      <div className="min-w-0">
        <AppHeading level="h3" variant={compact ? "title" : "headingM"} className="text-[var(--app-color-text-primary)]" truncate>{title}</AppHeading>
        {description && <AppCaption className="mt-0.5 text-[var(--app-color-text-muted)]">{description}</AppCaption>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export default SectionHeader;
