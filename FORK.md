# Forking GoalTracker

GoalTracker is a personal OS template. Most product shape lives in config, not page markup.

## 1. Brand

Edit [`lib/config/brand.ts`](lib/config/brand.ts):

- `name`, `shortName`, `tagline`, `description`
- `markClassName` for the logo chip

## 2. Modules (navigation surfaces)

Edit [`lib/config/modules.ts`](lib/config/modules.ts):

- Set `enabled: false` to hide a route from nav without deleting it
- Set `nav` to `primary` | `secondary` | `none` to reshape the shell
- Change `label` / `href` / `icon` as needed

Disabled modules are omitted from nav and redirected to `/dashboard` by middleware.

## 3. Trackers (daily metrics)

Edit [`lib/config/trackers.ts`](lib/config/trackers.ts):

- Toggle `showOnDashboard` and `countsTowardDailyWin`
- Rename `label` / `helper`
- Adjust `queryAliases` used by `/check-ins?type=…` deep links
- Pick which tracker is `streakEligible`

Dashboard tiles, the Today checklist, and check-in deep links all read from this registry.

## 4. Domain hooks + feature modules

Logic lives in domain hooks; pages are thin composers:

| Domain | Hook | View | Page |
| --- | --- | --- | --- |
| Check-ins | `lib/checkins/use-checkins.ts` | `components/check-ins/check-ins-view.tsx` | `app/(app)/check-ins/page.tsx` |
| Workouts | `lib/workouts/use-workouts.ts` | `components/workouts/workouts-view.tsx` | `app/(app)/workouts/page.tsx` |
| Meals | `lib/meals/use-meals.ts` | `components/meals/meals-view.tsx` | `app/(app)/meals/page.tsx` |
| Projects | `lib/projects/use-projects.ts` | `components/projects/projects-view.tsx` | `app/(app)/projects/page.tsx` |

Shared helpers: `lib/checkins/domain.ts`, `lib/*/api.ts`, `lib/goals/progress.ts`.

Prefer extending these instead of growing page files.

## 5. Environment

Copy [`.env.example`](.env.example) to `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only; required for Settings → Delete account)
- `OPENAI_API_KEY` (optional until AI routes are used)
- `OPENAI_MODEL` (defaults to `gpt-4o-mini`)

The app is served under `basePath` `/goal`. Missing Supabase public env vars throw an actionable error (no silent empty app).

Never set `NEXT_PUBLIC_VISUAL_REVIEW=1` on Vercel — mock mode is for local screenshots only and is hard-disabled when `NODE_ENV=production`.

## 6. Deploy checklist (hosted Supabase + Vercel)

1. `npm install`
2. In Supabase SQL Editor, run migrations `001`–`007` in order (or `supabase db push` / link the project)
3. Confirm Storage bucket `progress-photos` exists (created by `002`) and is **private**
4. **Auth → URL configuration**: add redirect allowlist entries:
   - `https://<your-domain>/goal/auth/callback`
   - `http://localhost:3000/goal/auth/callback` (local)
5. Vercel → Project → Settings → Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (for delete-account)
   - `OPENAI_API_KEY` / `OPENAI_MODEL` (optional AI)
6. Deploy; open `https://<host>/goal`, sign up, complete onboarding, log a check-in
7. Confirm `/goal/icons/icon-192.png`, `/goal/icons/icon-512.png`, and `/goal/manifest.webmanifest`

## 7. Local first-run (empty DB is not a brick wall)

```bash
npm install
cp .env.example .env.local
# Prefer local stack:
supabase start   # applies migrations + seed.sql grants
# Paste URL + anon key from `supabase status` into .env.local
npm run dev
# → http://localhost:3000/goal
```

If you applied migrations without a reset and see `permission denied for table …`, re-run [`supabase/seed.sql`](supabase/seed.sql).
