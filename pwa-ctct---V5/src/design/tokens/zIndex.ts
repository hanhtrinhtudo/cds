export const zIndex = {
  base: 0,
  sticky: 10,
  header: 40,
  bottomNav: 50,
  dropdown: 60,
  modal: 100,
  toast: 120
} as const;

export type ZIndexTokens = typeof zIndex;
