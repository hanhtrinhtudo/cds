# AI Workspace Final Polish

## Scope

Sprint 6.4I was visual-only. No AI runtime, service, Apps Script, prompt payload, authentication, routing, storage, or business logic was changed.

## Files changed

- `src/App.tsx`
- `src/components/AITutor.tsx`
- `src/components/product/ChatBubble.tsx`
- `src/index.css`

## Visual improvements

### Avatar

- AI/user avatar remains 24×24px.
- Avatar spacing uses an 8px gap to the bubble.
- Avatar no longer competes visually with the message.

### Bubble width

- AI bubble row max width: 82%.
- User bubble row max width: 84%.
- Long content wraps naturally and does not stretch across the viewport.

### Toolbar

- AI toolbar is compact at approximately 52–56px.
- Runtime measured height: ~52.7px.
- Toolbar contains only title/status, compact document selector, and clear action.

### Welcome state

- Removed the default welcome conversation bubble.
- Replaced it with a lightweight centered welcome block.
- Welcome block is not rendered as a message bubble and does not create conversation chrome.

### Bubble spacing

- Message gap is now approximately 12px.
- Runtime measured distance between adjacent messages at 390px: 12px.

### Conversation viewport

- The global app header is hidden only on the AI tab to create a full-page AI workspace.
- AI main viewport top padding is removed only for the AI tab.
- This is visual-only; routing, state, auth, and services are unchanged.

Runtime viewport gains:

| Viewport | Before final polish | After final polish | Result |
|---|---:|---:|---|
| 390×844 active chat | ~613px after local compacting, ~621px from previous sprint baseline | 680px | +59–67px recovered |
| 430×932 active chat | ~701px after local compacting, ~709px from previous sprint baseline | 768px | +59–67px recovered |

The practical improvement is larger because the top global app header no longer competes with the AI toolbar; visually the workspace now starts at the top of the app shell.

### Composer

- Composer remains fixed in the bottom area.
- Runtime measured active composer height: ~52.7px.
- Send button remains touch-safe.
- No active-chat disclaimer is shown after the conversation begins.

## Known limitations

- Existing source files still contain historical mojibake strings. This sprint avoided broad encoding cleanup because business logic is frozen and the request was visual-only.
- The global app header is hidden only for AI to maximize reading area. Other tabs retain existing header behavior.

## Result

PASS

