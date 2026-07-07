# Apps Script Live Integration Report

## Target

The configured production Auth Apps Script deployment was identified from `VITE_LEGACY_AUTH_API_URL`. No URL, token, credential, spreadsheet ID, or password is reproduced in this report.

## Source access assessment

- No `.gs`, `appsscript.json`, or `.clasp.json` exists in the workspace.
- Only the deployment `/exec` URL is configured.
- A deployment ID does not provide the Apps Script source project ID or editor access.
- The in-app browser had the PTKV application open, but no authenticated Apps Script editor/source tab was available.

Because the actual source project could not be opened, the additive patch could not be pasted, its existing token resolver could not be identified safely, and a new deployment version could not be published.

## Prepared integration

`PERSISTENCE_APPS_SCRIPT_PATCH.gs.md` contains:

- the four additive schemas;
- exact requested actions;
- dispatcher integration snippet;
- `requireAuthUser_` adapter points for common existing token helpers;
- handshake and migration markers;
- LockService/idempotency/validation/sanitized response behavior.

The integration must be performed in the actual Apps Script project so `requireAuthUser_` can call its real session lookup function. Guessing that function or deriving ownership from request `userId` is explicitly unsafe.

## Existing-contract regression status

No deployed code was changed, so existing login/register/news/exam/bank/result behavior was not altered by this sprint. Regression testing after deployment remains required.

