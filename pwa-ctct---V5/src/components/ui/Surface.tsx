import React from "react";

export type SurfaceVariant = "neutral" | "brandSoft" | "warningSoft" | "dangerSoft" | "successSoft" | "infoSoft";

export interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SurfaceVariant;
}

const variantClass: Record<SurfaceVariant, string> = {
  neutral: "bg-[var(--app-color-surface-soft)] text-[var(--app-color-text-primary)]",
  brandSoft: "bg-[var(--brand-warm)] text-red-950",
  warningSoft: "bg-[var(--app-color-warning-soft)] text-[var(--app-color-warning)]",
  dangerSoft: "bg-[var(--app-color-danger-soft)] text-[var(--app-color-danger)]",
  successSoft: "bg-[var(--app-color-success-soft)] text-[var(--app-color-success)]",
  infoSoft: "bg-[var(--app-color-info-soft)] text-[var(--app-color-info)]"
};

export function Surface({ variant = "neutral", className = "", ...props }: SurfaceProps) {
  return <div {...props} className={["rounded-2xl p-2.5", variantClass[variant], className].filter(Boolean).join(" ")} />;
}

export default Surface;
