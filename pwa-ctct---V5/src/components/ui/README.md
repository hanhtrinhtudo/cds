# PTKV Core Component Library

Sprint 6.3C introduces the first reusable UI primitive layer for the PTKV mobile app.

## Principles

- UI primitives contain presentation only: no routing, no Apps Script calls, no authentication, no business rules.
- Components use design tokens, CSS utilities, and the typography layer (`AppText`, `AppHeading`, `AppLabel`, `AppCaption`).
- Components must preserve mobile touch targets and readable Vietnamese text.
- Product screens may migrate gradually; this sprint is not a full component rewrite.

## Components

- `Button`: primary actions, secondary actions, ghost actions, semantic danger/warning/success actions.
- `IconButton`: accessible icon-only actions; `aria-label` is required.
- `Card`: standard content container with optional `Header`, `Body`, and `Footer`.
- `Surface`: low-emphasis panels used when a full card would add visual noise.
- `Badge`: semantic status labels such as active, pending, completed, review, locked, expired.
- `Chip`: compact filters and AI prompt chips.
- `Input`: labelled text input with helper/error text and optional icons.
- `Select`: labelled select with placeholder, helper/error text, and typed options.
- `Alert`: compact info/success/warning/danger/neutral messages.
- `EmptyState`: honest empty/error states for news, learning, exam, ranking, results.
- `Skeleton`: loading placeholders for lines, cards, lists, news, and avatars.
- `SectionHeader`: consistent section title/description/action layout.
- `ListItem`: reusable list row for later news, learning, ranking, and review migrations.

## Migration guidance

Prefer this order in future sprints:

1. Replace repeated section titles with `SectionHeader`.
2. Replace primary/secondary CTA buttons with `Button`.
3. Replace icon-only controls with `IconButton`.
4. Replace status pills with `Badge`.
5. Replace warning/empty/loading panels with `Alert`, `EmptyState`, and `Skeleton`.
6. Extract repeated row patterns into `ListItem`.

Keep logic in screen components and services until a separate architecture refactor is explicitly approved.
