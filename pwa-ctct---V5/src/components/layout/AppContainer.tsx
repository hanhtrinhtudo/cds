import React from "react";

export interface AppContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  compact?: boolean;
  bleed?: boolean;
  maxWidth?: boolean;
}

export function AppContainer({ compact = false, bleed = false, maxWidth = true, className = "", ...props }: AppContainerProps) {
  return (
    <div
      {...props}
      className={[
        "w-full",
        bleed ? "px-0" : compact ? "px-2" : "px-[var(--app-page-padding)]",
        maxWidth ? "mx-auto max-w-[var(--app-content-max-width)]" : "",
        className
      ].filter(Boolean).join(" ")}
    />
  );
}

export default AppContainer;
