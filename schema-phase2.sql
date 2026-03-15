-- OurTask Phase 2 Schema Additions

-- Organizations table
CREATE TABLE organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  website VARCHAR(500),
  logo_url TEXT,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50),
  address VARCHAR(500),
  category VARCHAR(50) CHECK (category IN ('nonprofit', 'government', 'community', 'religious', 'other')),
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP,
  verified_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Org membership (users belong to orgs)
CREATE TABLE org_members (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(org_id, user_id)
);

-- Link tasks to orgs (optional)
ALTER TABLE tasks ADD COLUMN org_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL;

-- Notification preferences
ALTER TABLE users ADD COLUMN notify_email BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN notify_nearby_radius INTEGER DEFAULT 25; -- km
ALTER TABLE users ADD COLUMN notify_categories TEXT DEFAULT ''; -- comma-separated
ALTER TABLE users ADD COLUMN last_digest_at TIMESTAMP;

-- Notification log (track what we've sent)
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('volunteer_joined', 'volunteer_left', 'task_completed', 'task_nearby', 'weekly_digest', 'welcome')),
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  subject VARCHAR(255),
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  email_id VARCHAR(255) -- Brevo message ID for tracking
);

-- Impact stats (aggregated daily)
CREATE TABLE impact_stats (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  tasks_created INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  volunteers_joined INTEGER DEFAULT 0,
  unique_volunteers INTEGER DEFAULT 0,
  categories_active INTEGER DEFAULT 0,
  UNIQUE(date)
);

-- Indexes
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_verified ON organizations(is_verified);
CREATE INDEX idx_org_members_org ON org_members(org_id);
CREATE INDEX idx_org_members_user ON org_members(user_id);
CREATE INDEX idx_tasks_org_id ON tasks(org_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_impact_stats_date ON impact_stats(date);
