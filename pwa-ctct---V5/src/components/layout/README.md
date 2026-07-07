# PTKV Enterprise Layout Primitives

These components standardize page geometry without owning routing, data, storage, or business state.

- `AppPage`: page background, safe-area options, and workspace variant.
- `AppContainer`: horizontal padding and content-width boundary.
- `AppStack`: semantic vertical rhythm.
- `AppGrid`: mobile-first responsive grids.
- `AppToolbar`: page-level title row using typography primitives.
- `AppWorkspace`: full-height flex workspace with optional top/bottom slots.
- `AppBottomBar`: safe-area-aware action/composer/navigation surface.
- `AppScrollable`: one predictable flex scroll region.
- `AppDivider`: semantic divider color and optional inset.

Screens retain orchestration. Layout components must never import services or access browser storage.
