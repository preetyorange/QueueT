# QueueT

A multi-board, real-time collaborative task manager — React frontend, Supabase
(Postgres) backend, live multi-user sync and presence, drag-and-drop cards with
priorities and due dates, and email/password auth.

## Features

- Multiple boards, each with its own columns and cards
- Create/rename-free columns (add and delete), add/edit/delete cards
- Drag-and-drop across columns with persisted ordering
- Card details: description, priority (low/medium/high), due date
- Real-time sync — every board update (card moved, card added, column deleted)
  appears instantly for every other signed-in user viewing that board
- Live presence — see avatars for who else is currently viewing the board
- Email/password authentication with session persistence
- Client-side routing (boards list → individual board) via React Router

## Setup (about 20 minutes)

1. **Create a Supabase project**: https://supabase.com → New project (free tier).
2. **Run the schema**: Supabase dashboard → SQL Editor → paste in the contents of
   `supabase_schema.sql` → Run. This creates `boards`, `columns`, `cards`, enables
   realtime on all three, and sets row-level security.
3. **Enable email auth / Turn off email confirmation**: Go to Authentication → Sign In / Providers → click "Email" → toggle "Confirm email" off. This allows you to sign up and log in instantly for local development.
4. **Get your API keys**: Project Settings → API → copy the Project URL and the
   `anon public` key.
5. **Configure the app**:
   ```
   cp .env.example .env
   ```
   Paste your URL and anon key into `.env`.
6. **Install and run**:
   ```
   npm install
   npm run dev
   ```
7. Sign up, create a board, add a few cards. Open the same board in a second
   browser tab (or log in as a second account) — drag a card or add one, and
   watch it appear live in the other tab, with a presence avatar showing who's there.

## Deploying

Push this folder to a GitHub repo, import it on https://vercel.com, add the same
two environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in the
Vercel project settings, and deploy. You'll have a live link for your resume/portfolio.

## How it works

- **Auth**: Supabase Auth (`signUp` / `signInWithPassword`) handles signup, login,
  and session persistence.
- **Data model**: `boards` → `columns` → `cards`, each scoped by foreign key.
  Cards carry priority, due date, description, and creator.
- **Drag and drop**: `@dnd-kit` handles reordering within and across columns; on
  drop, the app writes the new `column_id` and `position` for every affected
  card back to Postgres, with an optimistic local update so the drag feels instant.
- **Real-time sync**: a Supabase Realtime channel subscribes to Postgres change
  events on `boards`, `columns`, and `cards`. Any insert/update/delete triggers
  every connected client to refetch, so changes propagate live.
- **Presence**: a separate Supabase Realtime presence channel (keyed by board id)
  tracks who currently has the board open, powering the avatar stack in the header.
- **Routing**: React Router splits the app into a boards list and per-board views,
  each with their own data loading.

## Resume line

> Built QueueT, a multi-board real-time collaborative task manager (React,
> React Router, Supabase/Postgres) with drag-and-drop task management, live
> presence, and WebSocket-based multi-user sync.

## Notes on security

Row-level security policies here are intentionally simple (any authenticated
user can read/write any board) to keep the demo self-contained. If you want to
mention access control on your resume too, the natural next step is scoping
boards to a `members` join table and writing RLS policies that check membership
instead of just `auth.role() = 'authenticated'`.
