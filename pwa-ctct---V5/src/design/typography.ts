export type TypographyVariant =
  | "displayXl"
  | "display"
  | "headingXl"
  | "headingL"
  | "headingM"
  | "title"
  | "subtitle"
  | "bodyL"
  | "body"
  | "bodyS"
  | "caption"
  | "overline"
  | "label"
  | "button";

export const enterpriseTypography: Record<TypographyVariant, {
  fontSize: string;
  lineHeight: string;
  fontWeight: number;
  letterSpacing: string;
  responsive: string;
}> = {
  displayXl: { fontSize: "32px", lineHeight: "38px", fontWeight: 900, letterSpacing: "-0.035em", responsive: "Use for rare hero titles; may scale to 36px on tablet." },
  display: { fontSize: "28px", lineHeight: "34px", fontWeight: 900, letterSpacing: "-0.03em", responsive: "Use for primary mobile landing titles." },
  headingXl: { fontSize: "26px", lineHeight: "32px", fontWeight: 800, letterSpacing: "-0.025em", responsive: "Use for screen titles." },
  headingL: { fontSize: "22px", lineHeight: "30px", fontWeight: 800, letterSpacing: "-0.02em", responsive: "Use for major section titles." },
  headingM: { fontSize: "20px", lineHeight: "28px", fontWeight: 750, letterSpacing: "-0.015em", responsive: "Use for compact section titles." },
  title: { fontSize: "18px", lineHeight: "26px", fontWeight: 750, letterSpacing: "-0.01em", responsive: "Use for card and module titles." },
  subtitle: { fontSize: "16px", lineHeight: "24px", fontWeight: 600, letterSpacing: "0", responsive: "Use for secondary explanatory text." },
  bodyL: { fontSize: "16px", lineHeight: "26px", fontWeight: 400, letterSpacing: "0", responsive: "Use for longer readable content." },
  body: { fontSize: "16px", lineHeight: "25px", fontWeight: 400, letterSpacing: "0", responsive: "Default mobile body for primary reading." },
  bodyS: { fontSize: "15px", lineHeight: "23px", fontWeight: 500, letterSpacing: "0", responsive: "Use for dense supporting text only." },
  caption: { fontSize: "12px", lineHeight: "17px", fontWeight: 600, letterSpacing: "0", responsive: "Minimum metadata and helper text size." },
  overline: { fontSize: "12px", lineHeight: "16px", fontWeight: 700, letterSpacing: "0.045em", responsive: "Use uppercase sparingly for section labels and badges." },
  label: { fontSize: "13px", lineHeight: "19px", fontWeight: 600, letterSpacing: "0.005em", responsive: "Use for form labels and stable UI labels." },
  button: { fontSize: "15px", lineHeight: "20px", fontWeight: 600, letterSpacing: "0", responsive: "Use for buttons; preserve 44px touch target." }
} as const;

export const typographyClassByVariant: Record<TypographyVariant, string> = {
  displayXl: "text-display-xl",
  display: "text-display",
  headingXl: "text-heading-xl",
  headingL: "text-heading-l",
  headingM: "text-heading",
  title: "text-title",
  subtitle: "text-subtitle",
  bodyL: "text-body-l",
  body: "text-body",
  bodyS: "text-body-s",
  caption: "text-caption",
  overline: "text-overline",
  label: "text-label",
  button: "text-button"
};
