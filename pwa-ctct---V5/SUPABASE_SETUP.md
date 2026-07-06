# Supabase Database Setup

This MVP uses Supabase/PostgreSQL as the database only. It does not use Supabase Auth.

Authentication is managed by the app:

- Passwords are stored as bcrypt hashes in the `users` table.
- Login is checked by the backend.
- The backend issues a seven-day JWT containing `sub`, role, and account status.
- Protected APIs verify the backend-issued JWT.

## Environment

Create `.env` from `.env.example`:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-backend-only-service-role-key
JWT_SECRET=replace-with-a-random-secret-of-at-least-32-characters
VITE_API_BASE_URL=
```

Do not expose `SUPABASE_SERVICE_ROLE_KEY` or `JWT_SECRET` through `VITE_*`.
The server refuses to start when Supabase is missing or `JWT_SECRET` is shorter than 32 characters.

## Database

Run `schema.sql` in Supabase SQL Editor. It creates UUID-based `units`, the app-managed `users` table, and the rest of the application tables.

The schema is intended for a fresh MVP database. If an older database has text unit IDs or `users_profile` foreign keys, back it up and migrate those relationships before applying the UUID schema. Authentication always reads from `users`; it never reads from `users_profile` or `auth.users`.

Then run `seed.sql` to create demo accounts and sample learning data.

For an existing schema where only the demo accounts need to be created or repaired, run:

```bash
npm run users:seed
```

This backend-only script loads `.env`, hashes every demo password with bcrypt, and upserts matching `users` rows. It does not call Supabase Auth.

## Demo Accounts

```text
admin@example.com / Admin@123456 / admin / active
cuong@example.com / Demo@123456 / political_officer / active
instructor@example.com / Demo@123456 / instructor / active
member@example.com / Demo@123456 / member / active
```

The seed stores bcrypt hashes only. It does not store plaintext passwords.

## First Login With Temporary Password

Admins can create users through `POST /api/users` with `temporaryPassword`.

New admin-created users are stored with:

```text
must_change_password = true
```

Those users must call `POST /api/auth/change-password` before protected APIs allow normal work.
The existing login screen performs this change-password step automatically after a successful first login.
