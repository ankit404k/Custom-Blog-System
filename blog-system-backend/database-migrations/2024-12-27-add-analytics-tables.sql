-- Analytics System Enhancement Migration
-- Add likes table, views table, and daily analytics aggregation

USE blog_system;

-- Likes table - track which users liked which posts
CREATE TABLE IF NOT EXISTS likes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_post_like (post_id, user_id),
    INDEX idx_post_id (post_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Views table - track individual post views (for detailed analytics)
CREATE TABLE IF NOT EXISTS post_views (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL,
    user_id INT NULL, -- NULL for anonymous visitors
    session_id VARCHAR(255), -- For tracking unique sessions
    ip_address VARCHAR(45),
    user_agent TEXT,
    referrer VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_post_id (post_id),
    INDEX idx_user_id (user_id),
    INDEX idx_session_id (session_id),
    INDEX idx_created_at (created_at),
    INDEX idx_post_date (post_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Daily analytics aggregation table - pre-aggregated data for performance
CREATE TABLE IF NOT EXISTS analytics_daily (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL,
    date DATE NOT NULL,
    views_count INT DEFAULT 0,
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    unique_visitors INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_post_date (post_id, date),
    INDEX idx_post_id (post_id),
    INDEX idx_date (date),
    INDEX idx_post_date (post_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add activity tracking to users table (if not exists)
-- Track last login time and activity status
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at;

-- Add indexes for performance on existing tables
CREATE INDEX IF NOT EXISTS idx_posts_user_status ON posts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_comments_post_status_date ON comments(post_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_post_created ON analytics(post_id, created_at);

-- Create triggers to update analytics table when likes change
DELIMITER //

CREATE TRIGGER IF NOT EXISTS after_like_insert
AFTER INSERT ON likes
FOR EACH ROW
BEGIN
    INSERT INTO analytics (post_id, likes)
    VALUES (NEW.post_id, 1)
    ON DUPLICATE KEY UPDATE likes = likes + 1;
END//

CREATE TRIGGER IF NOT EXISTS after_like_delete
AFTER DELETE ON likes
FOR EACH ROW
BEGIN
    UPDATE analytics SET likes = likes - 1 WHERE post_id = OLD.post_id;
END//

DELIMITER ;
