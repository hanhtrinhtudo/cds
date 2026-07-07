import React from "react";
import { AppCaption, AppHeading } from "../ui";

export interface AppToolbarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  compact?: boolean;
  sticky?: boolean;
}

export function AppToolbar({ title, subtitle, leading, trailing, compact = false, sticky = false, className = "", ...props }: AppToolbarProps) {
  return (
    <div
      {...props}
      className={[
        "flex min-h-[var(--app-top-bar-height)] items-center justify-between gap-3",
        compact ? "py-1.5" : "py-2",
        sticky ? "sticky top-0 z-20 bg-[var(--app-color-bg)]/95 backdrop-blur-md" : "",
        className
      ].filter(Boolean).join(" ")}
    >
      <div className="flex min-w-0 items-center gap-2">
        {leading}
        <div className="min-w-0">
          <AppHeading level="h2" variant={compact ? "title" : "headingM"}>{title}</AppHeading>
          {subtitle && <AppCaption className="mt-0.5">{subtitle}</AppCaption>}
        </div>
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  );
}

export default AppToolbar;
