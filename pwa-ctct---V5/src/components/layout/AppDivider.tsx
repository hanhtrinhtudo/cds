import React from "react";

export interface AppDividerProps extends React.HTMLAttributes<HTMLHRElement> {
  inset?: boolean;
}

export function AppDivider({ inset = false, className = "", ...props }: AppDividerProps) {
  return <hr {...props} className={["border-0 border-t border-[var(--app-color-divider)]", inset ? "mx-3" : "", className].filter(Boolean).join(" ")} />;
}

export default AppDivider;
