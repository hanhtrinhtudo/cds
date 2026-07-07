import { colors } from "./colors";

export const semantic = {
  active: { foreground: colors.brand.primary, background: colors.brand.goldSoft, border: colors.brand.gold },
  pending: { foreground: colors.semantic.warning, background: colors.semantic.warningSoft, border: "#FED7AA" },
  completed: { foreground: colors.semantic.success, background: colors.semantic.successSoft, border: "#BBF7D0" },
  locked: { foreground: colors.neutral.textMuted, background: colors.neutral.surfaceSoft, border: colors.neutral.border },
  expired: { foreground: colors.neutral.textMuted, background: "#F1F5F9", border: "#CBD5E1" },
  review: { foreground: "#C2410C", background: colors.semantic.warningSoft, border: "#FDBA74" },
  warning: { foreground: colors.semantic.warning, background: colors.semantic.warningSoft, border: "#FDE68A" },
  error: { foreground: colors.semantic.danger, background: colors.semantic.dangerSoft, border: "#FECACA" },
  success: { foreground: colors.semantic.success, background: colors.semantic.successSoft, border: "#BBF7D0" },
  info: { foreground: colors.semantic.info, background: colors.semantic.infoSoft, border: "#BFDBFE" },
  draft: { foreground: colors.neutral.textMuted, background: colors.neutral.surfaceSoft, border: colors.neutral.border },
  published: { foreground: colors.semantic.success, background: colors.semantic.successSoft, border: "#BBF7D0" },
  approved: { foreground: colors.semantic.success, background: colors.semantic.successSoft, border: "#BBF7D0" },
  rejected: { foreground: colors.semantic.danger, background: colors.semantic.dangerSoft, border: "#FECACA" }
} as const;

export type SemanticTokens = typeof semantic;
