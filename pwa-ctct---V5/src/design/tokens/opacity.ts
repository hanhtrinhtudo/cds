export const opacity = {
  disabled: "0.38",
  muted: "0.64",
  overlay: "0.52",
  pressed: "0.86"
} as const;

export type OpacityTokens = typeof opacity;
