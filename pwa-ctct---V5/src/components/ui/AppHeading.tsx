import React from "react";
import { TypographyVariant, typographyClassByVariant } from "../../design";

type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
type HeadingVariant = Extract<TypographyVariant, "displayXl" | "display" | "headingXl" | "headingL" | "headingM" | "title">;

export interface AppHeadingProps {
  level?: HeadingLevel;
  variant?: HeadingVariant;
  color?: "default" | "inverse" | "brand" | "muted";
  align?: "left" | "center" | "right";
  truncate?: boolean;
  responsive?: boolean;
  className?: string;
  children: React.ReactNode;
}

const colorClass = {
  default: "text-[var(--app-color-text-primary)]",
  inverse: "text-white",
  brand: "text-[var(--app-color-brand-primary)]",
  muted: "text-[var(--app-color-text-secondary)]"
} as const;

const alignClass = {
  left: "text-left",
  center: "text-center",
  right: "text-right"
} as const;

export function AppHeading({
  level: Component = "h2",
  variant = "headingM",
  color = "default",
  align = "left",
  truncate = false,
  responsive: _responsive = true,
  className = "",
  children
}: AppHeadingProps) {
  const classes = [
    typographyClassByVariant[variant],
    "font-extrabold",
    colorClass[color],
    alignClass[align],
    truncate ? "truncate" : "",
    className
  ].filter(Boolean).join(" ");

  return <Component className={classes}>{children}</Component>;
}

export default AppHeading;
