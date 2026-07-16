-- Student Ambassadors Table
-- Run this SQL against the u336570575_alumni database

CREATE TABLE IF NOT EXISTS `student_ambassadors` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `photo_url`    VARCHAR(500) DEFAULT NULL,
  `name`         VARCHAR(255) NOT NULL,
  `school`       VARCHAR(255) DEFAULT NULL,
  `department`   VARCHAR(255) DEFAULT NULL,
  `phone`        VARCHAR(30)  DEFAULT NULL,
  `linkedin_id`  VARCHAR(255) DEFAULT NULL,
  `instagram_id` VARCHAR(255) DEFAULT NULL,
  `sort_order`   INT DEFAULT 0,
  `created_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
