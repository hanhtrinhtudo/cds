import React from "react";

export type BadgeVariant = "active" | "pending" | "completed" | "review" | "locked" | "expired" | "success" | "warning" | "danger" | "info" | "neutral";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClass: Record<BadgeVariant, string> = {
  active: "bg-[var(--app-color-brand-gold)] text-red-950 border-[var(--app-color-brand-gold)]",
  pending: "bg-[var(--app-color-warning-soft)] text-[var(--app-color-warning)] border-orange-200",
  completed: "bg-[var(--app-color-success-soft)] text-[var(--app-color-success)] border-green-200",
  review: "bg-[var(--app-color-warning-soft)] text-orange-800 border-orange-200",
  locked: "bg-[var(--app-color-surface-soft)] text-[var(--app-color-text-muted)] border-[var(--app-color-border)]",
  expired: "bg-[var(--app-color-surface-soft)] text-[var(--app-color-text-muted)] border-[var(--app-color-border)]",
  success: "bg-[var(--app-color-success-soft)] text-[var(--app-color-success)] border-green-200",
  warning: "bg-[var(--app-color-warning-soft)] text-[var(--app-color-warning)] border-orange-200",
  danger: "bg-[var(--app-color-danger-soft)] text-[var(--app-color-danger)] border-red-200",
  info: "bg-[var(--app-color-info-soft)] text-[var(--app-color-info)] border-blue-200",
  neutral: "bg-[var(--app-color-surface-soft)] text-[var(--app-color-text-secondary)] border-[var(--app-color-border)]"
};

export function Badge({ variant = "neutral", className = "", children, ...props }: BadgeProps) {
  return (
    <span {...props} className={["motion-status inline-flex min-h-6 items-center gap-1 rounded-full border px-2.5 py-0.5 text-caption font-semibold leading-none", variantClass[variant], className].filter(Boolean).join(" ")}>
      {children}
    </span>
  );
}

export default Badge;
