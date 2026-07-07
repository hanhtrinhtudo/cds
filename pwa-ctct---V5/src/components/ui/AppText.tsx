import React from "react";
import { TypographyVariant, typographyClassByVariant } from "../../design";

type TextColor = "default" | "secondary" | "muted" | "inverse" | "brand" | "danger" | "success" | "warning";
type TextAlign = "left" | "center" | "right";
type TextWeight = "regular" | "medium" | "semibold" | "bold" | "black";

const colorClass: Record<TextColor, string> = {
  default: "text-[var(--app-color-text-primary)]",
  secondary: "text-[var(--app-color-text-secondary)]",
  muted: "text-[var(--app-color-text-muted)]",
  inverse: "text-white",
  brand: "text-[var(--app-color-brand-primary)]",
  danger: "text-[var(--app-color-danger)]",
  success: "text-[var(--app-color-success)]",
  warning: "text-[var(--app-color-warning)]"
};

const alignClass: Record<TextAlign, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right"
};

const weightClass: Record<TextWeight, string> = {
  regular: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
  black: "font-extrabold"
};

export interface AppTextProps {
  as?: "p" | "span" | "div";
  variant?: TypographyVariant;
  weight?: TextWeight;
  color?: TextColor;
  align?: TextAlign;
  truncate?: boolean;
  responsive?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function AppText({
  as: Component = "p",
  variant = "body",
  weight,
  color = "default",
  align = "left",
  truncate = false,
  responsive: _responsive = true,
  className = "",
  children
}: AppTextProps) {
  const classes = [
    typographyClassByVariant[variant],
    colorClass[color],
    alignClass[align],
    weight ? weightClass[weight] : "",
    truncate ? "truncate" : "",
    className
  ].filter(Boolean).join(" ");

  return <Component className={classes}>{children}</Component>;
}

export default AppText;
