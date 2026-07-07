import React from "react";

export interface AppBottomBarProps extends React.HTMLAttributes<HTMLDivElement> {
  sticky?: boolean;
  safeArea?: boolean;
  elevated?: boolean;
}

export function AppBottomBar({ sticky = false, safeArea = true, elevated = false, className = "", ...props }: AppBottomBarProps) {
  return (
    <div
      {...props}
      className={[
        "w-full bg-[var(--app-color-surface)]",
        sticky ? "sticky bottom-0 z-30" : "",
        safeArea ? "pb-[env(safe-area-inset-bottom)]" : "",
        elevated ? "border-t border-[var(--app-color-divider)] shadow-[0_-8px_18px_rgba(15,23,42,0.08)]" : "",
        className
      ].filter(Boolean).join(" ")}
    />
  );
}

export default AppBottomBar;
