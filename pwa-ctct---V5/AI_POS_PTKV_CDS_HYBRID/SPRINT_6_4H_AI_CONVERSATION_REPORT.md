# Sprint 6.4H — AI Conversation Experience Report

## Executive summary

Status: PASS

Sprint 6.4H fixed the AI Workspace release blocker where long AI answers were difficult to read. The AI page now behaves as a mobile chat workspace:

- Header remains fixed at the top of the AI workspace.
- Conversation is the only main scrollable area.
- Composer stays at the bottom above the app bottom navigation.
- Prompt suggestions collapse after the first user message.
- New messages and AI typing/results auto-scroll when the user is near the bottom.
- Long AI responses remain fully reachable by scrolling the conversation viewport.

No AI service, Apps Script endpoint, auth, routing, storage, or business data flow was changed.

## Files changed

- `src/components/AITutor.tsx`
- `src/components/product/ChatComposer.tsx`
- `src/index.css`

## Layout model before/after

Before:

- Prompt chips and disclaimer remained part of the bottom area longer than needed.
- Composer area consumed too much vertical space during active conversation.
- Scroll anchoring relied only on message count/loading and could feel unreliable for long responses.

After:

- Root AI workspace is full-height, `min-height: 0`, and overflow-hidden.
- Toolbar is `shrink-0`.
- Conversation viewport is `flex-1`, `min-height: 0`, `overflow-y: auto`, mobile momentum scrolling.
- Bottom composer area is `shrink-0`.
- Suggestions show only before a user message exists.
- Disclaimer shows only before the conversation starts.

## Scroll behavior implemented

- Added a reusable bottom-scroll helper in `AITutor.tsx`.
- Uses bottom sentinel plus `requestAnimationFrame` and a zero-delay follow-up scroll after render.
- Tracks whether the user is near the bottom.
- Forces scroll only after a new user message.
- Does not aggressively pull the user down while they are reading older content.

## Prompt suggestions behavior

Visible before conversation starts:

- Tóm tắt
- Giải thích
- Ôn tập
- Tra cứu
- Kế hoạch

After the first user message:

- Suggestions collapse completely.
- Composer height drops to the compact active-chat height.

## Composer behavior

- One-line input remains the default.
- Send button remains 44px+ touch-friendly.
- Active conversation composer measured approximately 53px high.
- Composer sits above bottom navigation and does not cover unread content.

## Runtime QA result

Learner session was available in the in-app browser and tested through the normal app UI.

Test prompt used:

> Tóm tắt tài liệu đang chọn và nêu 3 ý chính cần ghi nhớ.

Observed at 390×844:

- Conversation viewport: 621px high after suggestions collapsed.
- Composer: ~53px high.
- Bottom navigation: 52px high.
- Suggestions: collapsed after sending.
- Typing indicator: visible.
- Long AI response: generated and fully scrollable.
- Conversation scroll height: 1798px.
- End of response: reachable.
- Horizontal overflow: none.

Observed at 430×932:

- Conversation viewport: 709px high.
- Composer: ~53px high.
- Bottom navigation: 52px high.
- Suggestions: collapsed.
- Long response remains scrollable.
- End of response: reachable.
- Horizontal overflow: none.

## Validation result

- `npm run lint`: PASS
- `npm run build`: PASS
- Vite preview `http://127.0.0.1:4173`: HTTP 200

Build emitted the existing non-blocking chunk-size warning only.

## Known limitations

- The current AI response rendering is still simple markdown-like rendering, not a full markdown parser.
- Sources remain collapsed using native `<details>`, which is acceptable for this release but can be refined later.
- Some existing Vietnamese strings in source files appear mojibake-encoded from prior project history; this sprint did not change product language or encoding.

## Final decision

PASS

