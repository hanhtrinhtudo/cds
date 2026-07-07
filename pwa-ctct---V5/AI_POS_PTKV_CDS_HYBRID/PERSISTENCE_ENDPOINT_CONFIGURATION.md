# Persistence Endpoint Configuration

Date: 2026-07-07

## Endpoint resolver audited

File: `src/services/persistenceService.ts`

Current resolver order:

```ts
VITE_PERSISTENCE_API_URL
VITE_APPS_SCRIPT_API_URL
VITE_LEGACY_AUTH_API_URL
```

This satisfies the Sprint 7.2B preferred configuration pattern.

## Current local production configuration

The local `.env.production` contains:

- `VITE_PERSISTENCE_API_URL`: set
- `VITE_LEGACY_AUTH_API_URL`: set

Both variables currently point to the same persistence-enabled deployment. This is acceptable because the deployment preserves legacy auth/admin actions and exposes the persistence dispatcher.

## Required Netlify variables

Set:

```env
VITE_PERSISTENCE_API_URL=<persistence-enabled Apps Script /exec URL>
```

Keep:

```env
VITE_LEGACY_AUTH_API_URL=<existing Auth Apps Script /exec URL>
```

Optional:

```env
VITE_APPS_SCRIPT_API_URL=<shared Apps Script /exec URL only if it supports persistence + auth>
```

## Verification command

After setting the variable, verify without exposing the URL:

```powershell
# Use the configured URL and append ?action=persistence.health
# Expected: service="persistence", supportsPersistence=true, sheetsReady=true
```

## Verification result

`persistence.health` returned:

- `service: "persistence"`
- `supportsPersistence: true`
- `apiVersion: 1`
- `schemaVersion: 1`
- `sheetsReady: true`
- `build: "7.1A-merged-auth-rc1"`

## Decision

Configuration PASS.
