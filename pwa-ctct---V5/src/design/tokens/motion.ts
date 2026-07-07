export const motion = {
  duration: {
    extraFast: "120ms",
    fast: "180ms",
    normal: "240ms",
    slow: "320ms",
    verySlow: "450ms"
  },
  easing: {
    standard: "cubic-bezier(0.2, 0, 0, 1)",
    accelerate: "cubic-bezier(0.4, 0, 1, 1)",
    decelerate: "cubic-bezier(0, 0, 0.2, 1)",
    emphasized: "cubic-bezier(0.2, 0, 0, 1)"
  },
  transition: {
    base: "180ms cubic-bezier(0.2, 0, 0, 1)",
    normal: "240ms cubic-bezier(0.2, 0, 0, 1)",
    emphasized: "320ms cubic-bezier(0.2, 0, 0, 1)"
  }
} as const;

export type MotionTokens = typeof motion;
