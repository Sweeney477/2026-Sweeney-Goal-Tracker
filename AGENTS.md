# AGENTS.md

## Cursor Cloud specific instructions

This is a Next.js 14 (App Router) PWA backed by Supabase (Postgres + Auth + Storage). OpenAI is only used by the optional AI routes under `app/api/ai/*`.

### Services

| Service | Purpose | How to run | Notes |
|---|---|---|---|
| Next.js dev server | The web app | `npm run dev` (see `package.json`) | Served under the `/goal` basePath (see `next.config.js`), so open `http://localhost:3000/goal`. The bare `/` returns 404. |
| Local Supabase | Postgres/Auth/Storage backend | `supabase start` | Requires Docker. Applies `supabase/migrations/*` automatically on first start. Stop with `supabase stop`. |

### Environment

- `.env.local` (gitignored) must contain `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. For local dev these are the default values printed by `supabase start` (URL `http://127.0.0.1:54321`).
- `OPENAI_API_KEY` (and optional `OPENAI_MODEL`) is only needed for the AI features (goal-plan, weekly-review, meal-estimate). The core flows (auth, onboarding, creating goals, check-ins) work without it; the "Generate Tracking Plan" button is the only thing that fails without a key.

### Non-obvious gotchas

- Docker daemon is not started automatically. Start it (`sudo dockerd &`) before `supabase start`, and ensure the socket is accessible to the `ubuntu` user (e.g. `sudo chmod 666 /var/run/docker.sock`).
- This repo originally had no `supabase/config.toml`; it is now committed so `supabase start` works out of the box.
- Local Supabase has email confirmations disabled (`supabase/config.toml` -> `enable_confirmations = false`), so a sign-up is immediately usable. The login UI still says "Check your email for the login link!" after sign-up — just toggle back to "Sign in" and log in with the same credentials.
- After first login, middleware (`middleware.ts`) forces new users through `/goal/onboarding` until the profile's `onboarding_completed_at` is set; onboarding then redirects to `/goal/goals/new`.
- `next lint` only reports warnings (e.g. `<img>` usage) — there are no errors.
