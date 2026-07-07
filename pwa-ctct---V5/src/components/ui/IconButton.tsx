import React from "react";

export type IconButtonVariant = "default" | "ghost" | "primary" | "danger";
export type IconButtonSize = "sm" | "md" | "lg";

export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> {
  "aria-label": string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  loading?: boolean;
  icon: React.ReactNode;
}

const variantClass: Record<IconButtonVariant, string> = {
  default: "bg-[var(--app-color-surface-soft)] text-[var(--app-color-text-secondary)] hover:bg-[var(--app-color-section)] focus:ring-slate-400/30",
  ghost: "bg-transparent text-[var(--app-color-text-secondary)] hover:bg-[var(--app-color-surface-soft)] focus:ring-slate-400/30",
  primary: "bg-[var(--app-color-brand-primary)] text-white hover:bg-[var(--app-color-brand-primary-dark)] focus:ring-red-800/25",
  danger: "bg-[var(--app-color-danger-soft)] text-[var(--app-color-danger)] hover:bg-red-100 focus:ring-red-700/25"
};

const sizeClass: Record<IconButtonSize, string> = {
  sm: "h-11 w-11 rounded-xl",
  md: "h-11 w-11 rounded-2xl",
  lg: "h-12 w-12 rounded-2xl"
};

export function IconButton({
  variant = "default",
  size = "md",
  loading = false,
  disabled,
  icon,
  className = "",
  ...props
}: IconButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={[
        "motion-interactive inline-flex items-center justify-center focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
        variantClass[variant],
        sizeClass[size],
        className
      ].filter(Boolean).join(" ")}
    >
      {loading ? <span className="motion-spinner h-4 w-4 rounded-full border-2 border-current border-t-transparent" aria-hidden="true" /> : icon}
    </button>
  );
}

export default IconButton;
