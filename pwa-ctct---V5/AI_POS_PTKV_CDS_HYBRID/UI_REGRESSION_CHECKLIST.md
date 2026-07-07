# UI Regression Checklist

Run before any post-freeze release candidate.

## Global

- [ ] No white screen.
- [ ] No horizontal overflow.
- [ ] No content hidden behind bottom navigation.
- [ ] Bottom navigation labels remain one line.
- [ ] Touch targets are at least 44px for primary interactive controls.
- [ ] Loading/empty/error states are product-friendly.

## Learner

- [ ] Login through normal auth flow.
- [ ] Dashboard renders.
- [ ] Học tập list renders.
- [ ] Learning detail opens.
- [ ] Learning detail buttons are touch-safe.
- [ ] Kiểm tra / Thi thử renders.
- [ ] Tin tức renders.
- [ ] News thumbnails or branded fallback render.
- [ ] Hỏi AI opens.
- [ ] AI composer stays fixed.
- [ ] Cá nhân / Kết quả / Bảng xếp hạng opens.

## Admin

- [ ] Login through normal auth flow.
- [ ] Admin entry is visible.
- [ ] Admin panel opens.
- [ ] User management renders.
- [ ] Role/status controls are touch-safe.
- [ ] Static-mode locked content/exam states are honest.
- [ ] No destructive admin action is performed during visual QA.

## Validation

- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Preview HTTP 200

