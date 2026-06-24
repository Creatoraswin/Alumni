-- add_indexes.sql
-- Run this script in your MySQL/phpMyAdmin console to add performance indexes

-- Indexes for alumni table
ALTER TABLE alumni ADD INDEX idx_alumni_created_at (created_at);
ALTER TABLE alumni ADD INDEX idx_alumni_user_id (user_id);

-- Indexes for events table
ALTER TABLE events ADD INDEX idx_events_created_at (created_at);
-- Assuming events table has an event_id if referenced elsewhere, but typically primary key is already indexed.

-- Indexes for alumni_talks table
ALTER TABLE alumni_talks ADD INDEX idx_alumni_talks_created_at (created_at);
-- If alumni_talks references event_id or user_id:
-- ALTER TABLE alumni_talks ADD INDEX idx_alumni_talks_user_id (user_id);

-- Indexes for jobs table
ALTER TABLE jobs ADD INDEX idx_jobs_created_at (created_at);
ALTER TABLE jobs ADD INDEX idx_jobs_user_id (user_id);
