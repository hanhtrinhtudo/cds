# UI Freeze Exceptions

## Approved exceptions

1. Admin content authoring
   - Status: locked in static mode.
   - Reason: current legacy Apps Script admin API supports account/audit operations, not full content/exam/question-bank authoring.

2. Question/bank management
   - Status: not visible as a dedicated admin module.
   - Reason: no safe static-mode frontend/backend capability was present for this release.

3. Review historical detail
   - Status: local-device review only unless backend detail exists.
   - Reason: backend historical detail lookup is not part of the current verified API set.

4. Vite chunk-size warning
   - Status: accepted non-blocking warning.
   - Reason: build succeeds and static deployment remains valid.

5. News detail automation
   - Status: component frozen; automated list-to-detail click not stable in this run.
   - Reason: news cards are interactive component surfaces, not simple buttons; no UI defect observed on news list.

## Not exceptions

- White screen: none observed.
- Horizontal overflow: none observed.
- Bottom nav overlap: none observed.
- Login failure: none; both learner and admin normal login succeeded.

