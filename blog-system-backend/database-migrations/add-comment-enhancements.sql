-- Comments System Enhancements Migration
-- Adds fields for rejection reason, flags, and rate limiting

USE blog_system;

-- Add new columns to comments table
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT NULL AFTER status,
ADD COLUMN IF NOT EXISTS flag_count INT DEFAULT 0 AFTER rejection_reason;

-- Create comment_flags table for tracking spam flags
CREATE TABLE IF NOT EXISTS comment_flags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    comment_id INT NOT NULL,
    user_id INT NOT NULL,
    reason VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_comment_flag (user_id, comment_id),
    INDEX idx_comment_id (comment_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create comment_rate_limit table for tracking user comment frequency
CREATE TABLE IF NOT EXISTS comment_rate_limit (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    comment_count INT DEFAULT 0,
    window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_rate_limit (user_id),
    INDEX idx_user_id (user_id),
    INDEX idx_window_start (window_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
