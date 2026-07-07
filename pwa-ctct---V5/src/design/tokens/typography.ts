export const typography = {
  display: { fontSize: "28px", lineHeight: "34px", fontWeight: 900, letterSpacing: "-0.03em" },
  heading1: { fontSize: "26px", lineHeight: "32px", fontWeight: 800, letterSpacing: "-0.025em" },
  heading2: { fontSize: "22px", lineHeight: "30px", fontWeight: 800, letterSpacing: "-0.02em" },
  heading3: { fontSize: "20px", lineHeight: "28px", fontWeight: 750, letterSpacing: "-0.01em" },
  title: { fontSize: "18px", lineHeight: "26px", fontWeight: 750, letterSpacing: "-0.005em" },
  subtitle: { fontSize: "16px", lineHeight: "24px", fontWeight: 600 },
  body: { fontSize: "16px", lineHeight: "25px", fontWeight: 400 },
  bodyStrong: { fontSize: "16px", lineHeight: "25px", fontWeight: 650 },
  label: { fontSize: "13px", lineHeight: "19px", fontWeight: 600, letterSpacing: "0.005em" },
  caption: { fontSize: "12px", lineHeight: "17px", fontWeight: 600 },
  micro: { fontSize: "12px", lineHeight: "16px", fontWeight: 650, letterSpacing: "0.02em" }
} as const;

export type TypographyTokens = typeof typography;
