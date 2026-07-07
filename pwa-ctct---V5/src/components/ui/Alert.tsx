import React from "react";
import { X } from "lucide-react";
import { AppCaption } from "./AppCaption";
import { AppText } from "./AppText";
import IconButton from "./IconButton";

export type AlertVariant = "info" | "success" | "warning" | "danger" | "neutral";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  onDismiss?: () => void;
}

const variantClass: Record<AlertVariant, string> = {
  info: "bg-[var(--app-color-info-soft)] border-blue-200 text-[var(--app-color-info)]",
  success: "bg-[var(--app-color-success-soft)] border-green-200 text-[var(--app-color-success)]",
  warning: "bg-[var(--app-color-warning-soft)] border-orange-200 text-[var(--app-color-warning)]",
  danger: "bg-[var(--app-color-danger-soft)] border-red-200 text-[var(--app-color-danger)]",
  neutral: "bg-[var(--app-color-surface-soft)] border-[var(--app-color-border)] text-[var(--app-color-text-primary)]"
};

export function Alert({ variant = "neutral", title, description, icon, onDismiss, className = "", children, ...props }: AlertProps) {
  return (
    <div {...props} className={["motion-status flex items-start gap-2 rounded-2xl border p-3", variantClass[variant], className].filter(Boolean).join(" ")}>
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div className="min-w-0 flex-1">
        {title && <AppText variant="bodyS" weight="bold" className="text-current">{title}</AppText>}
        {description && <AppCaption className="text-current">{description}</AppCaption>}
        {children}
      </div>
      {onDismiss && <IconButton aria-label="Đóng thông báo" size="sm" variant="ghost" icon={<X size={14} />} onClick={onDismiss} className="-m-1 text-current" />}
    </div>
  );
}

export default Alert;
