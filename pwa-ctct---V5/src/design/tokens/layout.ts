export const layout = {
  mobileContentMaxWidth: "428px",
  pagePadding: "10px",
  sectionGap: "10px",
  bottomNavHeight: "58px",
  topBarHeight: "52px",
  safeAreaBottom: "env(safe-area-inset-bottom)",
  safeAreaTop: "env(safe-area-inset-top)",
  aiWorkspaceMinHeight: "520px",
  touchTargetMin: "44px"
} as const;

export type LayoutTokens = typeof layout;
