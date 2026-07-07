import { colors, elevation, layout, motion, opacity, radius, semantic, spacing, typography, zIndex } from "./tokens";

export const theme = {
  colors,
  typography,
  spacing,
  radius,
  elevation,
  motion,
  opacity,
  zIndex,
  layout,
  semantic
} as const;

export type AppTheme = typeof theme;
