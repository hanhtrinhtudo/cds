# AI Runtime Chat QA

## Runtime environment

- App: local Vite preview
- URL: `http://127.0.0.1:4173`
- Deployment mode: Netlify static-compatible Vite build
- Auth mode: legacy Apps Script mode
- Account: learner test account, already authenticated normally in browser

## Runtime steps

1. Opened local preview.
2. Confirmed authenticated dashboard loaded.
3. Opened bottom navigation item `Hỏi AI`.
4. Verified AI workspace layout at 390×844.
5. Sent one short prompt through the normal composer:
   - `Tóm tắt tài liệu đang chọn và nêu 3 ý chính cần ghi nhớ.`
6. Confirmed typing indicator appeared.
7. Waited for AI response.
8. Verified long AI answer scroll/readability.
9. Rechecked layout at 430×932.

## Results

| Item | Result | Evidence |
|---|---|---|
| Normal app route access | PASS | Dashboard loaded before AI tab. |
| AI tab opens | PASS | `#ai-chat-screen-layout` present. |
| Prompt suggestions shown initially | PASS | Five one-line chips visible at 390px. |
| Suggestions collapse after submit | PASS | No chip texts after first user message. |
| Typing indicator visible | PASS | `.motion-typing-dot` present after submit. |
| AI response received | PASS | Long model response rendered. |
| Long response readable | PASS | Conversation scrollHeight exceeded clientHeight and end was reachable. |
| Composer bottom-aligned | PASS | Composer ended above bottom nav at both widths. |
| Horizontal overflow | PASS | None observed. |
| Build/runtime preview | PASS | HTTP 200. |

## Validation commands

- `npm run lint`: PASS
- `npm run build`: PASS
- Vite preview HTTP 200: PASS

## Known limitations

- Admin runtime QA was outside Sprint 6.4H scope.
- This sprint did not modify AI prompt payloads, services, or Apps Script gateway behavior.

## Final decision

PASS

