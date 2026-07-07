# PTKV Design Foundation

This folder contains the first enterprise design token foundation for the PTKV mobile-first static app.

Sprint 6.2 is intentionally foundational. It does not redesign every screen and does not replace every Tailwind class yet.

## Exports

- `tokens/colors.ts`
- `tokens/typography.ts`
- `tokens/spacing.ts`
- `tokens/radius.ts`
- `tokens/elevation.ts`
- `tokens/motion.ts`
- `tokens/opacity.ts`
- `tokens/zIndex.ts`
- `tokens/layout.ts`
- `tokens/semantic.ts`
- `theme.ts`
- `index.ts`

## Usage direction

Future UI work should:

- use semantic product tokens before raw Tailwind values;
- avoid unreadable mobile text such as `text-[7px]`, `text-[8px]`, `text-[9px]`, `text-[10px]`;
- avoid arbitrary radii unless the screen has a documented reason;
- prefer shared components for Button, Card, Badge, Chip, Input, Select, Alert, EmptyState, Skeleton, TopBar, BottomNav, ChatBubble, and ChatComposer;
- keep green for semantic success/correct/completed states only.

## CSS utilities

Global token-backed shell classes are currently defined in `src/index.css`:

- `.app-page`
- `.app-section`
- `.app-card`
- `.app-card-compact`
- `.app-title`
- `.app-subtitle`
- `.app-body`
- `.app-caption`
- `.app-top-bar`
- `.app-bottom-nav`
- `.ai-workspace`
- `.no-scrollbar`
