<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# AI Chính trị viên số

The Express backend uses Supabase PostgreSQL repositories as the only application data source. Authentication is app-managed with bcrypt and backend-issued JWTs; Supabase Auth is not used.

View your app in AI Studio: https://ai.studio/apps/1566cdb9-36e8-4135-848e-6008238725c6

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env` and configure `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `JWT_SECRET`.
3. Apply `schema.sql`, then `seed.sql` in Supabase SQL Editor, or run `npm run users:seed` for demo accounts on an existing schema.
4. Run the app:
   `npm run dev`
