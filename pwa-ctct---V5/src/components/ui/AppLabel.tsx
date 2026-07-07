import React from "react";
import { typographyClassByVariant } from "../../design";

export interface AppLabelProps {
  htmlFor?: string;
  as?: "label" | "span" | "p";
  color?: "default" | "muted" | "inverse" | "brand";
  truncate?: boolean;
  uppercase?: boolean;
  className?: string;
  children: React.ReactNode;
}

const colorClass = {
  default: "text-[var(--app-color-text-secondary)]",
  muted: "text-[var(--app-color-text-muted)]",
  inverse: "text-white",
  brand: "text-[var(--app-color-brand-primary)]"
} as const;

export function AppLabel({
  htmlFor,
  as: Component = "label",
  color = "default",
  truncate = false,
  uppercase = false,
  className = "",
  children
}: AppLabelProps) {
  const classes = [
    typographyClassByVariant.label,
    colorClass[color],
    uppercase ? "uppercase tracking-wide" : "",
    truncate ? "truncate" : "",
    className
  ].filter(Boolean).join(" ");

  return <Component htmlFor={Component === "label" ? htmlFor : undefined} className={classes}>{children}</Component>;
}

export default AppLabel;
