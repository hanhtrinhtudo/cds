import React from "react";
import { typographyClassByVariant } from "../../design";

export interface AppCaptionProps {
  as?: "p" | "span" | "div";
  id?: string;
  color?: "default" | "muted" | "inverse" | "brand" | "warning" | "danger";
  align?: "left" | "center" | "right";
  truncate?: boolean;
  overline?: boolean;
  className?: string;
  children: React.ReactNode;
}

const colorClass = {
  default: "text-[var(--app-color-text-secondary)]",
  muted: "text-[var(--app-color-text-muted)]",
  inverse: "text-white",
  brand: "text-[var(--app-color-brand-primary)]",
  warning: "text-[var(--app-color-warning)]",
  danger: "text-[var(--app-color-danger)]"
} as const;

const alignClass = {
  left: "text-left",
  center: "text-center",
  right: "text-right"
} as const;

export function AppCaption({
  as: Component = "p",
  id,
  color = "muted",
  align = "left",
  truncate = false,
  overline = false,
  className = "",
  children
}: AppCaptionProps) {
  const classes = [
    overline ? typographyClassByVariant.overline : typographyClassByVariant.caption,
    colorClass[color],
    alignClass[align],
    truncate ? "truncate" : "",
    overline ? "uppercase" : "",
    className
  ].filter(Boolean).join(" ");

  return <Component id={id} className={classes}>{children}</Component>;
}

export default AppCaption;
