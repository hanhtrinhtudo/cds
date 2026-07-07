import React, { useId } from "react";
import { AppCaption } from "./AppCaption";
import { AppLabel } from "./AppLabel";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  label?: string;
  helperText?: string;
  error?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function Select({ label, helperText, error, options, value, onChange, placeholder, id, className = "", ...props }: SelectProps) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const descriptionId = `${selectId}-description`;
  return (
    <div className="w-full">
      {label && <AppLabel htmlFor={selectId} className="mb-1 block font-bold text-[var(--app-color-text-secondary)]">{label}</AppLabel>}
      <select
        {...props}
        id={selectId}
        value={value}
        onChange={event => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={helperText || error ? descriptionId : undefined}
        className={["motion-interactive w-full min-h-11 rounded-xl border bg-white px-3 text-body-s focus:outline-none focus:ring-2 focus:ring-red-800/25", error ? "border-red-300" : "border-[var(--app-color-border)]", className].filter(Boolean).join(" ")}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(option => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
      </select>
      {(helperText || error) && <AppCaption id={descriptionId} color={error ? "danger" : "muted"} className="mt-1">{error || helperText}</AppCaption>}
    </div>
  );
}

export default Select;
