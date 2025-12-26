-- Comments System Migration Script
-- Run this to update the existing database schema for the comments system

-- Add new columns to comments table
ALTER TABLE comments
ADD COLUMN IF NOT EXISTS rejection_reason TEXT NULL AFTER status,
ADD COLUMN IF NOT EXISTS flag_count INT DEFAULT 0 NULL AFTER rejection_reason,
ADD COLUMN IF NOT EXISTS flag_reason TEXT NULL AFTER flag_count;

-- Update comments_count in analytics to only count approved comments
UPDATE analytics a
SET comments_count = (
    SELECT COUNT(*) FROM comments c
    WHERE c.post_id = a.post_id
    AND c.deleted_at IS NULL
    AND c.status = 'approved'
);

-- Add index on created_at for better sorting performance
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

-- Update permissions for comment management
INSERT INTO permissions (role, permission_name) VALUES
('admin', 'moderate_comments'),
('admin', 'approve_comments'),
('admin', 'reject_comments'),
('user', 'create_comments'),
('user', 'edit_own_comments'),
('user', 'delete_own_comments')
ON DUPLICATE KEY UPDATE permission_name = VALUES(permission_name);

SELECT 'Migration completed successfully!' as status;
