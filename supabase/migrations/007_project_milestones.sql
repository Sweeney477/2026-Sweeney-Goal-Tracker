-- Add milestones JSONB field to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS milestones_json JSONB DEFAULT '[]'::jsonb;

-- Index for querying milestones
CREATE INDEX IF NOT EXISTS idx_projects_milestones ON projects USING GIN (milestones_json);

