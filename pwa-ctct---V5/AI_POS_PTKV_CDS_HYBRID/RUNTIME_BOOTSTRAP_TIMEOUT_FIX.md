# Runtime Bootstrap Timeout Fix

## Summary

During Sprint 7.3D.5 closure QA, authenticated runtime testing found that the app could remain indefinitely on the bootstrap screen:

`ĐANG ĐỒNG BỘ CƠ SỞ DỮ LIỆU BAN CHỈ HUY...`

The issue was caused by legacy Apps Script bootstrap calls that could stall without a timeout path.

## File changed

- `src/App.tsx`

## Fix applied

- Added `LEGACY_BOOTSTRAP_TIMEOUT_MS = 8_000`.
- Added `settleBootstrap(request, fallback)`.
- Wrapped:
  - `authService.me()`
  - `learningService.getTopics()`
  - `examService.getExams()`

## Auth safety

- If `authService.me()` times out, the fallback is `null`.
- The app returns to normal login instead of trusting cached user data.
- No localStorage/sessionStorage seeding is used.
- No auth contract or permission behavior is changed.

## Data safety

- If learning or exam bootstrap times out, fallback data is an empty array.
- The shell can render honest no-data states instead of a frozen loading screen.
- No API contract is changed.
- No learner/admin data is fabricated.

## Runtime QA result

- Admin login reached Admin Command Shell after the timeout-safe bootstrap path.
- Learner login reached the learner shell after the timeout-safe bootstrap path.
- Logout/login flows remained normal.

## Validation

- `npm run lint`: PASS.
- `npm run build`: PASS.
- Vite preview: HTTP 200.

## Risk level

Low.

The change only prevents indefinite bootstrap blocking and uses safe fallbacks.
