# Banana Quest

Banana Quest is a child-friendly quiz game. The first screen is an explorer
registration page built with React and Vite. Accounts use Supabase Auth; the
player's nickname is stored in a minimal profile row.

## Database setup

Run [`../database/schema.sql`](../database/schema.sql) in the Supabase SQL
Editor from top to bottom. It creates the profile and registration tables,
assigns sequential `Player001`-style IDs when accounts are created, backfills
existing accounts, and configures row-level security in order. Passwords stay
in Supabase Auth and are never written to either game table.

In Supabase Auth settings, enable email confirmations so new accounts verify
their email address before signing in.

## Run locally

1. Copy `backend/.env.example` to `backend/.env` and fill in the Supabase URL
   and publishable key from your Supabase project.
2. Copy `frontend/.env.example` to `frontend/.env` if the API is not running at
   `http://localhost:3000`.
3. In `backend`, run `npm install`, then `npm run dev`.
4. In `frontend`, run `npm install`, then `npm run dev`.

The backend exposes `POST /api/auth/register`, `POST /api/auth/login`, and
`GET /api/health`. Login returns a Supabase session that the frontend keeps in
the current browser tab's session storage. Never put a Supabase secret key in
frontend code or commit real `.env` files.
