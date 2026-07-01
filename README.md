# QueueT

QueueT is a real‑time collaborative task board. In this guide you’ll learn how to set it up and use it.

## What you can do
- Create multiple boards, columns, and cards.
- Drag and‑drop cards, set priority and due date.
- See live updates from teammates.
- View presence avatars.
- Sign up with email/password.

## Getting started
1. Sign up for a free **Supabase** project.
2. Run the `supabase_schema.sql` script in your Supabase dashboard.
3. Copy the Supabase project URL and anon key into a `.env` file (see `.env.example`).
4. In your terminal run:
   ```bash
   npm install
   npm run dev
   ```
5. Open `http://localhost:5173` in your browser, sign up, create a board, add columns and cards. When you open the same board in another browser window or another account, you’ll see changes appear instantly.

## Deploying
- Push the code to **GitHub**.
- Import the repository on **Vercel**.
- In Vercel’s settings add the two environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Deploy – you now have a live link you can share.

## How it works
- **Auth** – Supabase Auth manages sign‑up and sign‑in.
- **Data model** – Boards contain columns, which contain cards.
- **Drag and drop** – Powered by `@dnd-kit`; moves update the DB.
- **Real‑time sync** – Supabase Realtime pushes changes to all connected clients.
- **Presence** – Shows who is currently viewing a board.
- **Routing** – React Router handles navigation between boards.

