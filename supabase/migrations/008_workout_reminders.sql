-- Workout reminder preferences + Web Push subscriptions

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS workout_reminder_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS workout_reminder_time TEXT DEFAULT '18:00',
ADD COLUMN IF NOT EXISTS workout_reminder_last_sent DATE;

COMMENT ON COLUMN profiles.workout_reminder_time IS 'Local HH:MM (24h) when to nudge for Workout Yes/No';
COMMENT ON COLUMN profiles.workout_reminder_last_sent IS 'Local calendar date of last workout reminder push';

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_workout_reminder
  ON profiles (workout_reminder_enabled)
  WHERE workout_reminder_enabled = true;

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own push subscriptions"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push subscriptions"
  ON push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own push subscriptions"
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);
