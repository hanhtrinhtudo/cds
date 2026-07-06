# Netlify Replacement Deployment

## Decision

The PTKV app cannot be deployed as static frontend only because the React UI calls `/api/*` for authentication, learning, quiz, exam, reports, news, notifications, and AI history. Login and protected data access depend on the backend using server-side JWT validation and Supabase service-role access.

Netlify replacement mode is therefore:

```text
Static Vite frontend + Netlify Function API
```

## Build

From the PTKV app folder:

```bash
npm install
npm run build:netlify
```

Build output:

```text
dist/
```

The build script creates:

- static frontend assets in `dist/`
- Netlify Function bundle in `dist/netlify/functions/api.js`
- `dist/netlify.toml` as a copy of the root Netlify config for folder replacement workflows

## GitHub folder replacement steps

1. Back up the old CDS folder in Git or create a branch.
2. Copy the contents of `ptkv/` into the GitHub folder that Netlify currently deploys, excluding:
   - `.env`
   - `.env.*`
   - `node_modules/`
   - old local `dist/` unless intentionally committing prebuilt static files
3. Ensure the replacement folder includes:
   - `package.json`
   - `package-lock.json`
   - `src/`
   - `netlify.toml`
   - `netlify/functions/api.ts`
   - `scripts/build-netlify-replacement.mjs`
   - `server.ts`
   - `schema.sql`
   - `RLS_PLAN.md`
4. Commit and push to GitHub.
5. Netlify redeploys automatically.

If the existing Netlify site is configured to publish a prebuilt folder directly, copy the contents of `ptkv/dist/` after running `npm run build:netlify`. The preferred GitHub deployment is source-based so Netlify can install dependencies and run the configured build command.

## Netlify settings

Build command:

```bash
npm run build:netlify
```

Publish directory:

```text
dist
```

Function directory:

```text
dist/netlify/functions
```

## Netlify environment variables

Set these in Netlify site environment variables. Do not put secrets in frontend code.

Required:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
JWT_SECRET
```

Recommended/optional:

```text
GEMINI_API_KEY
NODE_VERSION=20
```

Frontend:

```text
VITE_API_BASE_URL
```

Leave `VITE_API_BASE_URL` unset for same-site Netlify deployment so the frontend calls `/api/*`, which redirects to the Netlify Function. Only set it if intentionally pointing the frontend to another backend origin.

## Demo accounts

Local/staging demo accounts from DEMO RC1:

| Role | Email | Password |
|---|---|---|
| member | `demo_rc1_member@example.test` | `Demo_Rc1_Test_42!` |
| instructor | `demo_rc1_instructor@example.test` | `Demo_Rc1_Test_42!` |
| admin | `demo_rc1_admin@example.test` | `Demo_Rc1_Test_42!` |

These accounts must exist in the target Supabase database before they can log in on Netlify. Do not run production import without a future explicit approval gate.

## Production import status

Production import remains BLOCKED.
