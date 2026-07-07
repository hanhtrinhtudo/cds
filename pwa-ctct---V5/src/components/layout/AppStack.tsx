import React from "react";

export type AppStackGap = "xs" | "sm" | "md" | "lg" | "xl";

export interface AppStackProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: AppStackGap;
}

const gapClass: Record<AppStackGap, string> = {
  xs: "gap-1.5",
  sm: "gap-2",
  md: "gap-3",
  lg: "gap-4",
  xl: "gap-6"
};

export function AppStack({ gap = "md", className = "", ...props }: AppStackProps) {
  return <div {...props} className={["flex flex-col", gapClass[gap], className].filter(Boolean).join(" ")} />;
}

export default AppStack;
