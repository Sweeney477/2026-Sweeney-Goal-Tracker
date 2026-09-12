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

Copy `.env.example` (or create `.env.local`) with:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY` (optional until AI routes are used)
- `OPENAI_MODEL` (defaults to `gpt-4o-mini`)

The app is served under `basePath` `/goal`.

## 6. Deploy checklist

1. `npm install`
2. Apply Supabase migrations in `supabase/migrations`
3. `npm run build`
4. Confirm `/goal/icons/icon-192.png` and `icon-512.png` resolve
5. Sign in, complete onboarding, log a check-in
