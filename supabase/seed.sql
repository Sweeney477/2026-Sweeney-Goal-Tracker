-- Local-dev grants for Supabase CLI.
--
-- The app's migrations create tables as the `postgres` role and rely on
-- Supabase's default privileges to expose them to the `anon`/`authenticated`
-- roles (PostgREST). On hosted Supabase those DML grants are present, but the
-- local CLI's default privileges for the `postgres` role only grant
-- TRUNCATE/REFERENCES/TRIGGER on public tables, so authenticated users get
-- "permission denied for table ..." errors.
--
-- Re-apply the standard Supabase public-schema grants so local mirrors hosted.
-- Row Level Security (defined in the migrations) still restricts every role to
-- its own rows; these grants only allow the roles to attempt those RLS-checked
-- operations.

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
