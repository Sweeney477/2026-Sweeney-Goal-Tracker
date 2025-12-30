-- Add per-user target settings and onboarding tracking to profiles

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS calorie_goal INTEGER DEFAULT 2200,
ADD COLUMN IF NOT EXISTS step_goal INTEGER DEFAULT 10000,
ADD COLUMN IF NOT EXISTS coding_goal_minutes INTEGER DEFAULT 240,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Add constraints for reasonable ranges
ALTER TABLE profiles
ADD CONSTRAINT calorie_goal_range CHECK (calorie_goal IS NULL OR (calorie_goal >= 1000 AND calorie_goal <= 10000)),
ADD CONSTRAINT step_goal_range CHECK (step_goal IS NULL OR (step_goal >= 1000 AND step_goal <= 100000)),
ADD CONSTRAINT coding_goal_range CHECK (coding_goal_minutes IS NULL OR (coding_goal_minutes >= 0 AND coding_goal_minutes <= 1440));

-- Note: RLS policies already exist for profiles table from 001_initial_schema.sql
-- No additional policies needed since we're just adding columns

