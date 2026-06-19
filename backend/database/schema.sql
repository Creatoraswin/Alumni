-- Alumni Portal Database Schema
-- Database: Alumni
-- Description: MySQL database schema for Alumni Portal

-- Create database
CREATE DATABASE IF NOT EXISTS `Alumni` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `Alumni`;

-- ============================================================================
-- 1. Users Table (Authentication)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'department', 'student') DEFAULT 'student',
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. Students Table (Main Alumni Data)
-- ============================================================================
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    registration_no VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    personal_email VARCHAR(255),
    mobile_no VARCHAR(20),
    dob DATE,
    
    -- Academic Info
    school VARCHAR(100),
    programme VARCHAR(255),
    year_of_graduation INT,
    
    -- Current Position
    current_position VARCHAR(255),
    designation VARCHAR(255),
    organisation VARCHAR(255),
    place_of_work VARCHAR(255),
    present_occupation VARCHAR(255),
    
    -- Additional Info
    university_name VARCHAR(255),
    area_of_study VARCHAR(255),
    area_of_interest TEXT,
    location VARCHAR(255),
    address TEXT,
    linkedin_id VARCHAR(255),
    photo_url VARCHAR(500),
    feedback TEXT,
    
    -- Status & Metadata
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_registration_no (registration_no),
    INDEX idx_status (status),
    INDEX idx_graduation_year (year_of_graduation),
    INDEX idx_school (school),
    INDEX idx_programme (programme(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. Alumni Talks Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS alumni_talks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date_of_event DATE NOT NULL,
    name_of_alumni VARCHAR(255) NOT NULL,
    school VARCHAR(100),
    department VARCHAR(100),
    registration_no VARCHAR(50),
    banner_photo_url VARCHAR(500),
    talk_on TEXT,
    gallery_link VARCHAR(500),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_date (date_of_event),
    INDEX idx_school (school),
    INDEX idx_department (department),
    INDEX idx_name (name_of_alumni(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. Alumni Spotlight Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS alumni_spotlight (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date_added DATE NOT NULL,
    name_of_alumni VARCHAR(255) NOT NULL,
    year_of_graduation INT,
    school VARCHAR(100),
    department VARCHAR(100),
    registration_no VARCHAR(50),
    current_position VARCHAR(255),
    company_organization VARCHAR(255),
    photo_url VARCHAR(500),
    achievement_story TEXT,
    gallery_link VARCHAR(500),
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_status (status),
    INDEX idx_date (date_added),
    INDEX idx_school (school),
    INDEX idx_department (department),
    INDEX idx_name (name_of_alumni(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. Student Strength / StudentDB Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_strength (
    id INT AUTO_INCREMENT PRIMARY KEY,
    registration_no VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    batch VARCHAR(20),
    program VARCHAR(255),
    branch VARCHAR(100),
    passout_year INT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_registration_no (registration_no),
    INDEX idx_passout_year (passout_year),
    INDEX idx_batch (batch),
    INDEX idx_program (program(100)),
    INDEX idx_branch (branch)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. LinkedIn Status Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS linkedin_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    registration_no VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    linkedin_id VARCHAR(255),
    current_status VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_registration_no (registration_no),
    INDEX idx_status (current_status(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Insert Default Admin User
-- ============================================================================
-- Password: admin123 (hashed with PASSWORD_DEFAULT in PHP)
INSERT INTO users (username, password_hash, role, email) VALUES 
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'admin@cutmap.edu')
ON DUPLICATE KEY UPDATE username=username;
