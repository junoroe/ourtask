-- OurTask Seed Data — Kitsap County, WA
-- Run after schema.sql to populate with sample tasks

-- Demo user (password: OurTask2026!)
INSERT INTO users (email, password_hash, name, location)
VALUES (
  'demo@ourtask.org',
  '$2a$12$LJ3f5Wf5wF5Wf5Wf5Wf5WekYfGZJjSfYxLdxXkRvVmWnZcFkK6m6',
  'OurTask Team',
  'Kitsap County, WA'
) ON CONFLICT (email) DO NOTHING;

-- Sample tasks across Kitsap County
INSERT INTO tasks (user_id, title, slug, description, category, latitude, longitude, address, event_date, estimated_duration, volunteers_needed, status) VALUES

-- Clean
(1, 'Beach cleanup at Illahee State Park',
 'beach-cleanup-illahee-a1b2c3d4',
 'The beach area near the boat launch has accumulated trash and debris over the winter. We need volunteers to help pick up litter along the shoreline and trails. Bring gloves if you have them — we''ll have extra bags and supplies. Dogs welcome on leash!',
 'clean', 47.5960, -122.5970,
 'Illahee State Park, Bremerton, WA',
 NOW() + INTERVAL '7 days', '2-3 hours', 10, 'open'),

-- Green
(1, 'Plant wildflowers along Silverdale waterfront trail',
 'wildflowers-silverdale-e5f6g7h8',
 'Help us plant native wildflower seeds along the Silverdale waterfront trail to bring pollinators and color to the community. We have seeds donated by a local nursery. Bring a trowel or small shovel if you have one. Great family activity!',
 'green', 47.6440, -122.6850,
 'Silverdale Waterfront Park, Silverdale, WA',
 NOW() + INTERVAL '10 days', '2 hours', 8, 'open'),

-- Fix
(1, 'Repair trail markers on Ueland Tree Farm trails',
 'repair-markers-ueland-i9j0k1l2',
 'Several trail markers and directional signs on the Ueland Tree Farm public trails have been damaged by weather. We need help replacing faded signs and securing loose posts. Basic hand tools will be provided.',
 'fix', 47.6320, -122.6140,
 'Ueland Tree Farm, Bremerton, WA',
 NOW() + INTERVAL '14 days', '3-4 hours', 5, 'open'),

-- Feed
(1, 'Meal prep and distribution with Kitsap Rescue Mission',
 'meal-prep-krm-m3n4o5p6',
 'Partner with Kitsap Rescue Mission to prepare and distribute hot meals to community members in need. All food and supplies are provided by KRM. Volunteers needed for prep (10am) and serving (noon). No experience necessary — they''ll train you on the spot.',
 'feed', 47.5650, -122.6330,
 'Kitsap Rescue Mission, Bremerton, WA',
 NOW() + INTERVAL '3 days', '3 hours', 12, 'open'),

-- Build
(1, 'Build a Little Free Library at Evergreen-Rotary Park',
 'lfl-evergreen-q7r8s9t0',
 'We''re building and installing a Little Free Library at Evergreen-Rotary Park! Materials are donated. Need volunteers who can help with assembly (basic carpentry), painting, and installation. If you have books to donate, bring those too!',
 'build', 47.5530, -122.6370,
 'Evergreen-Rotary Park, Bremerton, WA',
 NOW() + INTERVAL '21 days', '4-5 hours', 6, 'open'),

-- Serve
(1, 'Companion visits at Crista Shores senior living',
 'companion-visits-crista-u1v2w3x4',
 'Spend an afternoon visiting with residents at Crista Shores senior living community. Many residents don''t get regular visitors and love having someone to chat with. Activities include board games, reading together, or just conversation. Background check through the facility (they handle it).',
 'serve', 47.6100, -122.6530,
 'Crista Shores, Silverdale, WA',
 NOW() + INTERVAL '5 days', '2 hours', 8, 'open');

-- Add some volunteer sign-ups to make it look active
-- (these reference user_id 1 and will only work if demo user was inserted as id 1)
