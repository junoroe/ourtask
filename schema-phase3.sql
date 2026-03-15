-- OurTask Phase 3 Schema Additions

-- Moderation log
CREATE TABLE moderation_log (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  approved BOOLEAN DEFAULT true,
  auto_approved BOOLEAN DEFAULT true,
  score INTEGER DEFAULT 0,
  flags JSONB DEFAULT '[]',
  warnings JSONB DEFAULT '[]',
  reason TEXT,
  reviewed_at TIMESTAMP,
  reviewed_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Badges
CREATE TABLE badges (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(10) NOT NULL, -- emoji
  category VARCHAR(50) NOT NULL CHECK (category IN ('volunteer', 'creator', 'community', 'special')),
  threshold INTEGER DEFAULT 1, -- how many actions to earn it
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User badges
CREATE TABLE user_badges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, badge_id)
);

-- Business sponsorships
CREATE TABLE sponsors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  logo_url TEXT,
  website VARCHAR(500),
  description TEXT,
  contact_email VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Task sponsorships (a sponsor can sponsor a task)
CREATE TABLE task_sponsors (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  sponsor_id INTEGER NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
  message TEXT, -- "Sponsored by Bob's Hardware — keeping Kitsap clean!"
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(task_id, sponsor_id)
);

-- City/area for dashboards
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS city VARCHAR(100);

-- Indexes
CREATE INDEX idx_moderation_task ON moderation_log(task_id);
CREATE INDEX idx_moderation_auto ON moderation_log(auto_approved);
CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge ON user_badges(badge_id);
CREATE INDEX idx_sponsors_active ON sponsors(is_active);
CREATE INDEX idx_task_sponsors_task ON task_sponsors(task_id);
CREATE INDEX idx_tasks_city ON tasks(city);

-- Seed badges
INSERT INTO badges (slug, name, description, icon, category, threshold) VALUES
  ('first-volunteer', 'First Step', 'Volunteered for your first task', '👣', 'volunteer', 1),
  ('five-tasks', 'Helping Hand', 'Volunteered for 5 tasks', '🤲', 'volunteer', 5),
  ('ten-tasks', 'Community Pillar', 'Volunteered for 10 tasks', '🏛️', 'volunteer', 10),
  ('twenty-five-tasks', 'Local Legend', 'Volunteered for 25 tasks', '⭐', 'volunteer', 25),
  ('first-post', 'Spotter', 'Posted your first task', '👁️', 'creator', 1),
  ('five-posts', 'Organizer', 'Posted 5 tasks', '📋', 'creator', 5),
  ('first-complete', 'Closer', 'Completed your first task', '✅', 'creator', 1),
  ('ten-completes', 'Finisher', 'Completed 10 tasks', '🏆', 'creator', 10),
  ('all-categories', 'Jack of All Trades', 'Volunteered across all 6 categories', '🎨', 'community', 6),
  ('streak-3', 'On a Roll', 'Volunteered 3 weeks in a row', '🔥', 'community', 3),
  ('early-adopter', 'Early Adopter', 'Joined during the Kitsap County pilot', '🌿', 'special', 1);
