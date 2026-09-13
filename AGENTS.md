# AGENTS.md

## Cursor Cloud / local agent notes

Next.js 14 (App Router) PWA + Supabase (Postgres, Auth, Storage). OpenAI is optional and only used by `app/api/ai/*`.

### Services

| Service | Purpose | How to run | Notes |
|---|---|---|---|
| Next.js | Web app | `npm run dev` | Served under `/goal` (`next.config.js`). Open `http://localhost:3000/goal`. |
| Local Supabase | Postgres / Auth / Storage | `supabase start` | Needs Docker. Applies `supabase/migrations/*` then `supabase/seed.sql`. |

### Environment

- Copy `.env.example` → `.env.local`.
- For local Supabase, use the URL/keys printed by `supabase start` (API URL is usually `http://127.0.0.1:54321`).
- `OPENAI_API_KEY` is **not** required for `npm run build` (client is lazy). Needed only when calling AI routes.
- Never set `NEXT_PUBLIC_VISUAL_REVIEW=1` in production — the mock is disabled when `NODE_ENV=production` anyway.

### Gotchas

- Local CLI may lack PostgREST DML grants that hosted Supabase has. `supabase/seed.sql` re-applies standard `anon` / `authenticated` / `service_role` grants. Re-run it after applying migrations without a reset.
- Local auth has email confirmations disabled (`supabase/config.toml`). After sign-up, switch to Sign in with the same credentials.
- Middleware + `(app)/layout` require auth; new users are forced through `/goal/onboarding` until `profiles.onboarding_completed_at` is set.
- Account deletion needs `SUPABASE_SERVICE_ROLE_KEY` on the server; without it the API returns 503 and does not wipe data.
