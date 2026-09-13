# Database migrations

Apply **in order** against a fresh Supabase project (SQL Editor) or via the CLI (`supabase db push` / `supabase start`).

| File | Purpose |
|------|---------|
| `001_initial_schema.sql` | profiles, goals, goal_plans, checkins, photos, workouts, projects + RLS + profile trigger |
| `002_storage_bucket.sql` | private `progress-photos` bucket + storage policies |
| `003_meals.sql` | meals table |
| `004_workouts_volume_and_exercises_library.sql` | workout volume JSON + exercise library |
| `005_rate_limits.sql` | AI rate-limit ledger |
| `006_profiles_targets.sql` | step/calorie/coding goals + onboarding timestamp |
| `007_project_milestones.sql` | project milestones |

## Local CLI

`supabase start` / `supabase db reset` also run [`../seed.sql`](../seed.sql), which grants PostgREST roles the DML privileges hosted Supabase usually has by default. Without that seed, local sign-in can hit `permission denied for table …`.

## After delete-account

Auth user deletion cascades to app tables (`ON DELETE CASCADE`). Storage objects under `progress-photos/{user_id}/` may still need a manual cleanup in the Storage UI if you want zero leftover blobs.
