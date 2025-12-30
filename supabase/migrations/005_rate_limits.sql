-- Rate limits table for AI route protection
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  route_key TEXT NOT NULL CHECK (route_key IN ('goal-plan', 'meal-estimate', 'weekly-review')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_route_time 
  ON rate_limits(user_id, route_key, created_at DESC);

-- Enable Row Level Security
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own rate limit records
CREATE POLICY "Users can view own rate limits"
  ON rate_limits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rate limits"
  ON rate_limits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Note: Users don't need to delete their own rate limits (cleanup is automatic)

