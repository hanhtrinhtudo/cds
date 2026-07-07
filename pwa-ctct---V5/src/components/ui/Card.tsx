import React from "react";

export type CardVariant = "default" | "compact" | "elevated" | "flat" | "interactive";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const variantClass: Record<CardVariant, string> = {
  default: "app-card motion-card",
  compact: "app-card-compact motion-card",
  elevated: "app-card app-shadow-medium motion-card",
  flat: "app-surface shadow-none",
  interactive: "app-interactive-item motion-card"
};

function Root({ variant = "default", className = "", ...props }: CardProps) {
  return <div {...props} className={[variantClass[variant], className].filter(Boolean).join(" ")} />;
}

function Header({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={["px-3 pt-3 pb-2", className].filter(Boolean).join(" ")} />;
}

function Body({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={["p-3", className].filter(Boolean).join(" ")} />;
}

function Footer({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={["px-3 pt-2 pb-3", className].filter(Boolean).join(" ")} />;
}

export const Card = Object.assign(Root, { Header, Body, Footer });
export default Card;
