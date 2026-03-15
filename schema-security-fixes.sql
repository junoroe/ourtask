-- Security fixes schema

-- Admin flag for users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Set Jason's test user as admin (user ID 1)
UPDATE users SET is_admin = true WHERE id = 1;

-- Cleanup: delete old login attempts
DELETE FROM login_attempts WHERE attempted_at < NOW() - INTERVAL '24 hours';

-- Cleanup: delete expired blacklisted tokens
DELETE FROM token_blacklist WHERE expires_at < CURRENT_TIMESTAMP;
