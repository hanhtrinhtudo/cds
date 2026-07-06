# Deployment: Netlify CDS Replacement with Legacy Apps Script Auth

## Deployment mode

This replacement is static Netlify hosting only.

```text
Vite React mobile UI + legacy Google Apps Script auth/API
```

It does not require an Express server, Netlify Functions, local Supabase, or Node backend at runtime.

## Required Netlify environment variables

Set these in Netlify site settings before deploying:

```text
VITE_AUTH_MODE=legacy_apps_script
VITE_LEGACY_AUTH_API_URL=<Apps Script Web App URL>
```

Do not set or expose `SUPABASE_SERVICE_ROLE_KEY` as a frontend variable.

`VITE_API_BASE_URL` should be left unset for this static legacy-auth replacement unless a later approved backend/API mode is introduced.

## Build settings

```text
Build command: npm run build
Publish directory: dist
```

The included `netlify.toml` and `public/_redirects` provide SPA fallback:

```text
/* /index.html 200
```

## GitHub replacement steps

1. Create a backup branch of the current CDS GitHub repository.
2. Remove the old static CDS app files from the deployed folder.
3. Copy the PTKV replacement source into that folder.
4. Include:
   - `src/`
   - `public/_redirects`
   - `index.html`
   - `package.json`
   - `package-lock.json`
   - `vite.config.ts`
   - `netlify.toml`
   - `DEPLOYMENT_NETLIFY_CDS_REPLACEMENT.md`
5. Do not commit:
   - `.env`
   - `.env.*`
   - `node_modules/`
   - local-only Supabase secrets
   - production import outputs
6. If the repository contains old or experimental server/function files, exclude them from the static CDS replacement folder unless a later gate explicitly approves server runtime.
7. Commit and push.
8. Netlify auto-deploys from GitHub.

## Legacy Apps Script API contract used by frontend

The frontend calls the Apps Script URL with JSON payloads containing `action`.

Supported auth/admin actions:

- `register`
- `login`
- `me`
- `log`
- `admin_set_role`
- `admin_set_status`
- `admin_list_users`
- `admin_list_audit`

Login request shape:

```json
{
  "action": "login",
  "username": "account-or-phone",
  "account": "account-or-phone",
  "password": "password"
}
```

Expected login response can use flexible field names, but must include a token:

```json
{
  "success": true,
  "token": "session-token",
  "user": {
    "id": "user-id",
    "name": "Full name",
    "username": "account",
    "unit": "Unit",
    "role": "user",
    "status": "active"
  }
}
```

Role mapping:

| Apps Script role | PTKV role |
|---|---|
| `user` | `member` |
| `admin` | `admin` |
| `chi-huy` | `political_officer` |
| `instructor` | `instructor` |

Status mapping:

| Apps Script status | PTKV status |
|---|---|
| `active` | `active` |
| `pending` | `pending` |
| `suspended` / `locked` | `suspended` |
| `rejected` / `denied` | `rejected` |

## Demo login test steps

1. Confirm Netlify environment variables are set.
2. Deploy the site.
3. Open the Netlify URL.
4. Login with an account that exists in the legacy Apps Script user store.
5. Confirm:
   - normal login form appears;
   - no MVP badge appears;
   - no quick login panel appears;
   - session persists after refresh;
   - admin users can open admin area if Apps Script returns `admin`.

## QR code target rule

The QR code for the presentation must point to the final Netlify site root URL, not a local IP, not `/api/auth/login`, and not an Apps Script URL.

Correct shape:

```text
https://<netlify-site>.netlify.app/
```

or the mapped custom domain root.

## Limitations

- Static legacy mode covers authentication/session and Apps Script admin/audit compatibility.
- Supabase learning, quiz, exam, report, notification, and AI backend APIs are not available in this static-only mode unless a future approved gate maps those APIs to Apps Script or another static-compatible backend.
- The existing local/Supabase mode remains available when `VITE_AUTH_MODE` is not `legacy_apps_script`.
- Production Supabase migration is deferred.

## Production Supabase migration status

Deferred. No production CDS data import is performed by this deployment mode.
