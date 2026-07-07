import React from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "warning" | "success";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "disabled"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: "bg-[var(--app-color-brand-primary)] text-white hover:bg-[var(--app-color-brand-primary-dark)] focus:ring-red-800/25",
  secondary: "bg-[var(--app-color-surface-soft)] text-[var(--app-color-text-primary)] hover:bg-[var(--app-color-section)] focus:ring-slate-400/30",
  ghost: "bg-transparent text-[var(--app-color-text-secondary)] hover:bg-[var(--app-color-surface-soft)] focus:ring-slate-400/30",
  danger: "bg-[var(--app-color-danger)] text-white hover:bg-red-800 focus:ring-red-700/25",
  warning: "bg-[var(--app-color-warning)] text-white hover:bg-amber-700 focus:ring-amber-600/25",
  success: "bg-[var(--app-color-success)] text-white hover:bg-green-800 focus:ring-green-700/25"
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "min-h-11 px-3 py-2 text-button rounded-xl",
  md: "min-h-11 px-4 py-2.5 text-button rounded-2xl",
  lg: "min-h-12 px-5 py-3 text-button rounded-2xl"
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      {...props}
      disabled={isDisabled}
      className={[
        "motion-interactive inline-flex items-center justify-center gap-2 font-semibold focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
        variantClass[variant],
        sizeClass[size],
        fullWidth ? "w-full" : "",
        className
      ].filter(Boolean).join(" ")}
    >
      {loading && <span className="motion-spinner h-4 w-4 rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />}
      {!loading && leftIcon}
      <span>{children}</span>
      {!loading && rightIcon}
    </button>
  );
}

export default Button;
