import React, { useId } from "react";
import { AppCaption } from "./AppCaption";
import { AppLabel } from "./AppLabel";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Input({ label, helperText, error, leftIcon, rightIcon, fullWidth = true, id, className = "", ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const descriptionId = `${inputId}-description`;
  return (
    <div className={fullWidth ? "w-full" : ""}>
      {label && <AppLabel htmlFor={inputId} className="mb-1 block font-bold text-[var(--app-color-text-secondary)]">{label}</AppLabel>}
      <div className="relative">
        {leftIcon && <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--app-color-text-muted)]">{leftIcon}</span>}
        <input
          {...props}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={helperText || error ? descriptionId : undefined}
          className={[
            "min-h-11 w-full rounded-xl border bg-[var(--app-color-surface-soft)] py-2.5 text-body transition focus:bg-white focus:outline-none focus:ring-2",
            leftIcon ? "pl-9" : "pl-3",
            rightIcon ? "pr-9" : "pr-3",
            error ? "border-red-300 focus:ring-red-800/25" : "border-[var(--app-color-border)] focus:ring-red-800/25",
            className
          ].filter(Boolean).join(" ")}
        />
        {rightIcon && <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--app-color-text-muted)]">{rightIcon}</span>}
      </div>
      {(helperText || error) && <AppCaption id={descriptionId} color={error ? "danger" : "muted"} className="mt-1">{error || helperText}</AppCaption>}
    </div>
  );
}

export default Input;
