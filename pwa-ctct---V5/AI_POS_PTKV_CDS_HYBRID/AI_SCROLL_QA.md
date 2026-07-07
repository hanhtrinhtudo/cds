# AI Scroll QA

## Scope

Validated AI Workspace scroll behavior after Sprint 6.4H.

## QA checklist

| Check | 390×844 | 430×932 | Notes |
|---|---:|---:|---|
| AI workspace root is overflow-hidden | PASS | PASS | Root does not create page-level scroll. |
| Conversation is the main scrollable area | PASS | PASS | `#ai-messages-viewport` is `overflow-y: auto`. |
| Composer stays outside scroll area | PASS | PASS | Composer remains in bottom slot. |
| Prompt suggestions collapse after first user message | PASS | PASS | No suggestion chips after submit. |
| Typing indicator appears after submit | PASS | Not re-submitted | Verified at 390 during live prompt. |
| Long AI response fully scrollable | PASS | PASS | Long response scrollHeight exceeded viewport and end was reachable. |
| Auto-scroll reaches latest response when near bottom | PASS | PASS | End sentinel reached after AI response. |
| User can scroll conversation independently | PASS | PASS | Conversation viewport owns scroll. |
| No horizontal overflow | PASS | PASS | `documentElement.scrollWidth <= window.innerWidth`. |
| No content hidden behind composer/bottom nav | PASS | PASS | Scroll viewport ends above composer; composer ends above bottom nav. |

## Runtime measurements

### 390×844

- AI root height: 719px
- Conversation viewport height after submit: 621px
- Conversation scroll height after long response: 1798px
- Composer height after submit: ~53px
- Bottom nav height: 52px
- End reachable: yes

### 430×932

- AI root height: 807px
- Conversation viewport height after submit: 709px
- Conversation scroll height after long response: 1648px
- Composer height after submit: ~53px
- Bottom nav height: 52px
- End reachable: yes

## Result

PASS

