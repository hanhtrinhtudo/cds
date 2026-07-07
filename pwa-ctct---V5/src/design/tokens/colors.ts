export const colors = {
  brand: {
    primary: "#A41919",
    primaryDark: "#8B1616",
    primaryLight: "#C92A2A",
    gold: "#FFD966",
    goldSoft: "#FFF1C7"
  },
  semantic: {
    success: "#15803D",
    successSoft: "#ECFDF3",
    warning: "#B45309",
    warningSoft: "#FFF7ED",
    danger: "#B91C1C",
    dangerSoft: "#FEF2F2",
    info: "#1D4ED8",
    infoSoft: "#EFF6FF"
  },
  neutral: {
    background: "#F7F5F2",
    surface: "#FFFFFF",
    surfaceSoft: "#FAF7F2",
    section: "#FFFDF8",
    textPrimary: "#111827",
    textSecondary: "#3F3F46",
    textMuted: "#71717A",
    border: "#E7DED2",
    borderStrong: "#D6C6B7",
    divider: "#EFE7DC"
  },
  state: {
    hover: "rgba(164, 25, 25, 0.08)",
    pressed: "rgba(164, 25, 25, 0.14)",
    disabled: "rgba(100, 116, 139, 0.38)",
    selected: "rgba(255, 217, 102, 0.28)"
  }
} as const;

export type ColorTokens = typeof colors;
