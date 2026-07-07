import React from "react";

export interface AppScrollableProps extends React.HTMLAttributes<HTMLDivElement> {
  hideScrollbar?: boolean;
  bottomPadding?: boolean;
}

export const AppScrollable = React.forwardRef<HTMLDivElement, AppScrollableProps>(function AppScrollable(
  { hideScrollbar = false, bottomPadding = false, className = "", ...props },
  ref
) {
  return (
    <div
      ref={ref}
      {...props}
      className={[
        "mobile-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain",
        hideScrollbar ? "no-scrollbar" : "",
        bottomPadding ? "pb-[calc(var(--app-bottom-nav-height)+env(safe-area-inset-bottom))]" : "",
        className
      ].filter(Boolean).join(" ")}
    />
  );
});

export default AppScrollable;
