import React from "react";

export type ChipVariant = "default" | "selected" | "brand" | "neutral";

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ChipVariant;
  selected?: boolean;
  icon?: React.ReactNode;
}

const variantClass: Record<ChipVariant, string> = {
  default: "bg-[var(--app-color-surface)] border-[var(--app-color-border)] text-[var(--app-color-text-secondary)] hover:bg-[var(--app-color-section)]",
  selected: "bg-[var(--app-color-brand-primary)] border-[var(--app-color-brand-primary)] text-white",
  brand: "bg-[var(--brand-warm)] border-[var(--app-color-border)] text-[var(--app-color-brand-primary)] hover:bg-[var(--app-color-section)]",
  neutral: "bg-[var(--app-color-surface-soft)] border-[var(--app-color-border)] text-[var(--app-color-text-secondary)] hover:bg-[var(--app-color-section)]"
};

export function Chip({ variant = "default", selected = false, icon, className = "", children, ...props }: ChipProps) {
  const resolvedVariant = selected ? "selected" : variant;
  return (
    <button
      type="button"
      {...props}
      className={["motion-chip inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-3 text-button font-semibold disabled:opacity-50", variantClass[resolvedVariant], className].filter(Boolean).join(" ")}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

export default Chip;
