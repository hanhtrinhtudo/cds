import React from "react";

export type AppPageVariant = "default" | "plain" | "workspace";

export interface AppPageProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AppPageVariant;
  withBottomInset?: boolean;
  withTopInset?: boolean;
  maxWidth?: boolean;
}

const variantClass: Record<AppPageVariant, string> = {
  default: "bg-[var(--app-color-bg)] text-[var(--app-color-text-primary)]",
  plain: "bg-transparent text-[var(--app-color-text-primary)]",
  workspace: "min-h-0 bg-[var(--app-color-bg)] text-[var(--app-color-text-primary)]"
};

export function AppPage({
  variant = "default",
  withBottomInset = false,
  withTopInset = false,
  maxWidth = false,
  className = "",
  ...props
}: AppPageProps) {
  return (
    <div
      {...props}
      className={[
        "w-full",
        variantClass[variant],
        withBottomInset ? "pb-[calc(var(--app-bottom-nav-height)+env(safe-area-inset-bottom))]" : "",
        withTopInset ? "pt-[env(safe-area-inset-top)]" : "",
        maxWidth ? "mx-auto max-w-[var(--app-content-max-width)]" : "",
        className
      ].filter(Boolean).join(" ")}
    />
  );
}

export default AppPage;
