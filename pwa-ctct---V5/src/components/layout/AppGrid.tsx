import React from "react";

export interface AppGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 1 | 2 | 3;
  gap?: "xs" | "sm" | "md" | "lg";
}

const columnsClass = { 1: "grid-cols-1", 2: "grid-cols-1 sm:grid-cols-2", 3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" } as const;
const gapClass = { xs: "gap-1.5", sm: "gap-2", md: "gap-3", lg: "gap-4" } as const;

export function AppGrid({ columns = 1, gap = "md", className = "", ...props }: AppGridProps) {
  return <div {...props} className={["grid", columnsClass[columns], gapClass[gap], className].filter(Boolean).join(" ")} />;
}

export default AppGrid;
