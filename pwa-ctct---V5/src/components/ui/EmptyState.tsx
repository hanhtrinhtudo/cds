import React from "react";
import { AppCaption } from "./AppCaption";
import { AppText } from "./AppText";

export type EmptyStateVariant = "default" | "search" | "results" | "ranking" | "exam" | "learning" | "news" | "error";

export interface EmptyStateProps {
  variant?: EmptyStateVariant;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div className={["motion-empty-state rounded-2xl bg-[var(--app-color-surface-soft)] p-3 text-center", className].filter(Boolean).join(" ")}>
      {icon && <div className="mb-2 flex justify-center text-[var(--app-color-text-muted)] opacity-60">{icon}</div>}
      <AppText variant="bodyS" weight="black" className="text-[var(--app-color-text-secondary)]">{title}</AppText>
      {description && <AppCaption className="mt-1 text-[var(--app-color-text-muted)]">{description}</AppCaption>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export default EmptyState;
