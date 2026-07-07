import React from "react";

export interface AppWorkspaceProps extends React.HTMLAttributes<HTMLDivElement> {
  scrollable?: boolean;
  topSlot?: React.ReactNode;
  bottomSlot?: React.ReactNode;
}

export function AppWorkspace({ scrollable = false, topSlot, bottomSlot, children, className = "", ...props }: AppWorkspaceProps) {
  return (
    <div {...props} className={["flex min-h-0 w-full flex-1 flex-col", className].filter(Boolean).join(" ")}>
      {topSlot && <div className="shrink-0">{topSlot}</div>}
      <div className={scrollable ? "mobile-scroll min-h-0 flex-1 overflow-y-auto no-scrollbar" : "flex min-h-0 flex-1 flex-col"}>{children}</div>
      {bottomSlot && <div className="shrink-0">{bottomSlot}</div>}
    </div>
  );
}

export default AppWorkspace;
