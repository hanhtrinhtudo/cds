export const elevation = {
  none: "none",
  subtle: "0 1px 2px rgba(15, 23, 42, 0.06)",
  card: "0 8px 22px rgba(15, 23, 42, 0.08)",
  floating: "0 18px 42px rgba(15, 23, 42, 0.16)",
  overlay: "0 24px 80px rgba(15, 23, 42, 0.28)"
} as const;

export type ElevationTokens = typeof elevation;
