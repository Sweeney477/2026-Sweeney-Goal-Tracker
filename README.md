# 2026 Personal Tracker

A personal operating system for tracking goals, fitness, and projects. Built with Next.js, Supabase, and OpenAI.

**App URL path:** everything lives under `/goal` (Next.js `basePath`). Local: [http://localhost:3000/goal](http://localhost:3000/goal).

## Features

- **Goal Management**: Create goals and optional AI tracking plans
- **Check-ins**: Log weight, steps, calories, coding minutes, and workouts
- **Progress Photos**: Private Supabase Storage photos over time
- **Weekly Projects**: Milestone-based vibe-coding projects
- **Meals**: Calorie/macros logging with optional photo estimates
- **Workouts**: Session builder + history
- **Weekly Review**: AI insights when `OPENAI_API_KEY` is set
- **PWA**: Installable under `/goal` with branded icons

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Database**: Supabase (PostgreSQL + RLS)
- **Storage**: Supabase Storage (`progress-photos`)
- **Auth**: Supabase Auth (email/password, OAuth providers you enable, password reset)
- **AI**: OpenAI Chat Completions (`gpt-4o-mini` default via `OPENAI_MODEL`) — lazy-loaded; build works without a key
- **UI**: Tailwind CSS + shadcn/ui
- **PWA**: `@ducanh2912/next-pwa` + `public/manifest.webmanifest`

## Get running in ~15 minutes

### Option A — Local Supabase (recommended for first run)

1. Prerequisites: Node 18+, Docker, [Supabase CLI](https://supabase.com/docs/guides/cli)
2. Clone, install, env:
   ```bash
   git clone <repository-url>
   cd 2026-Sweeney-Goal-Tracker
   npm install
   cp .env.example .env.local
   supabase start
   ```
3. Copy the **API URL** and **anon key** from `supabase status` into `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Optionally set `SUPABASE_SERVICE_ROLE_KEY` from the same output for account deletion.
4. Migrations `001`–`007` and grants seed run automatically on `supabase start`.
5. `npm run dev` → open [http://localhost:3000/goal](http://localhost:3000/goal)
6. Sign up → sign in (local email confirmation is off) → onboarding → create a goal → log a check-in

### Option B — Hosted Supabase + Vercel

1. Create a Supabase project. In **SQL Editor**, run each file in `supabase/migrations/` in order (`001` … `007`).
2. Confirm Storage bucket `progress-photos` (from `002`) is private.
3. **Authentication → URL Configuration** — allow:
   - `https://<your-vercel-domain>/goal/auth/callback`
   - Site URL can be `https://<your-vercel-domain>/goal`
4. In Vercel project env (Production + Preview as needed):

   | Variable | Required | Notes |
   |----------|----------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Yes | Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Anon/public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | For delete-account | Server-only; never `NEXT_PUBLIC_` |
   | `OPENAI_API_KEY` | For AI routes | Goal plan / meal estimate / weekly review |
   | `OPENAI_MODEL` | No | Default `gpt-4o-mini` |

5. Deploy. Open `https://<host>/goal`. Sign up, finish onboarding, log data.

Fork/brand/module knobs: [`FORK.md`](FORK.md). Agent/local gotchas: [`AGENTS.md`](AGENTS.md).

## First-time product loop

1. `/goal/auth/login` — Sign up / Sign in / Forgot password → `/goal/auth/reset`
2. `/goal/onboarding` — profile defaults
3. `/goal/dashboard` — “Minimum viable day” checklist
4. `/goal/check-ins`, `/goal/workouts`, `/goal/meals`, `/goal/goals`, `/goal/projects`
5. `/goal/settings` — targets, export, delete account (503 with a clear message if service role missing)

## Scripts

```bash
npm run dev
npm run typecheck
npm run build
npm start
npm run lint
```

Dummy Supabase public env values are enough for `typecheck` / `build`. Do not invent production credentials.

## Project structure

```
app/(app)/          # Protected product routes
app/auth/           # Login, forgot, reset, callback
app/api/            # AI, export, delete-account
components/         # Views + UI
lib/config/         # Brand, modules, trackers
lib/*/              # Domain hooks/helpers
supabase/migrations # 001–007 schema
supabase/seed.sql   # Local PostgREST grants
public/manifest.webmanifest
public/icons/
```

## Security notes

- Never expose the service role or OpenAI keys to the client
- RLS on all user tables; photos use signed URLs
- `NEXT_PUBLIC_VISUAL_REVIEW` mock mode is for local screenshots only and cannot activate in production builds

## License

MIT
