export const radius = {
  none: "0px",
  sm: "6px",
  md: "10px",
  lg: "14px",
  xl: "18px",
  card: "20px",
  sheet: "24px",
  overlay: "28px",
  pill: "999px",
  circle: "50%"
} as const;

export type RadiusTokens = typeof radius;
