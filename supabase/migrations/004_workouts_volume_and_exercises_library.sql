
-- Migration: workouts volume JSON and exercise library for picker/favorites

-- Extend workouts with volume_json and updated_at
ALTER TABLE workouts
ADD COLUMN IF NOT EXISTS volume_json JSONB DEFAULT '{"exercises": []}'::jsonb;

ALTER TABLE workouts
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Ensure workouts updated_at stays fresh
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_workouts_updated_at'
  ) THEN
    CREATE TRIGGER update_workouts_updated_at
    BEFORE UPDATE ON workouts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Exercises library for search / favorites / recents
CREATE TABLE IF NOT EXISTS exercises_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  lift_type TEXT,
  equipment TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_exercises_library_user_recent
  ON exercises_library(user_id, last_used_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_exercises_library_user_favorite
  ON exercises_library(user_id, is_favorite);

ALTER TABLE exercises_library ENABLE ROW LEVEL SECURITY;

-- RLS: users manage their own library entries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own exercises'
  ) THEN
    CREATE POLICY "Users can view own exercises"
      ON exercises_library FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own exercises'
  ) THEN
    CREATE POLICY "Users can insert own exercises"
      ON exercises_library FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own exercises'
  ) THEN
    CREATE POLICY "Users can update own exercises"
      ON exercises_library FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own exercises'
  ) THEN
    CREATE POLICY "Users can delete own exercises"
      ON exercises_library FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Keep exercises_library.updated_at current
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_exercises_library_updated_at'
  ) THEN
    CREATE TRIGGER update_exercises_library_updated_at
    BEFORE UPDATE ON exercises_library
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

