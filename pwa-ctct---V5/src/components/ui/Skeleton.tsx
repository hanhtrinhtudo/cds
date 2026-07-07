import React from "react";

export type SkeletonVariant = "line" | "card" | "avatar" | "list" | "news";

export interface SkeletonProps {
  variant?: SkeletonVariant;
  className?: string;
}

export function Skeleton({ variant = "line", className = "" }: SkeletonProps) {
  if (variant === "avatar") return <div className={["motion-skeleton h-10 w-10 rounded-full bg-[var(--app-color-border)]", className].filter(Boolean).join(" ")} />;
  if (variant === "card") return <div className={["motion-skeleton h-24 rounded-2xl bg-[var(--app-color-surface-soft)]", className].filter(Boolean).join(" ")} />;
  if (variant === "list") return <div className={["space-y-2", className].filter(Boolean).join(" ")}><div className="motion-skeleton h-3 w-4/5 rounded bg-[var(--app-color-border)]" /><div className="motion-skeleton h-3 w-2/3 rounded bg-[var(--app-color-surface-soft)]" /></div>;
  if (variant === "news") return <div className={["flex items-center gap-2.5 rounded-2xl bg-[var(--app-color-surface-soft)] p-2.5", className].filter(Boolean).join(" ")}><div className="motion-skeleton h-9 w-11 shrink-0 rounded-xl bg-[var(--app-color-border)]" /><div className="flex-1 space-y-1.5"><div className="motion-skeleton h-2.5 w-4/5 rounded bg-[var(--app-color-border)]" /><div className="motion-skeleton h-2 w-1/2 rounded bg-[var(--app-color-surface-soft)]" /></div></div>;
  return <div className={["motion-skeleton h-3 rounded bg-[var(--app-color-border)]", className].filter(Boolean).join(" ")} />;
}

export default Skeleton;
