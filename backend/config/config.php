<?php
/**
 * Application Configuration
 * 
 * Global configuration settings for Alumni Portal
 */

// CORS Settings
define('ALLOWED_ORIGINS', [
    'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost:3000',  // Next.js dev server
    'http://127.0.0.1:5173',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:3000',
    'https://cutmap-alumni-dashboard.web.app'
]);

// File Upload Settings
define('UPLOAD_BASE_PATH', dirname(__DIR__, 2) . '/Uploads/');
define('UPLOAD_PHOTOS_PATH', UPLOAD_BASE_PATH . 'Photos/');
define('UPLOAD_ALUMNI_TALK_PATH', UPLOAD_BASE_PATH . 'AlumniTalk/');
define('UPLOAD_ALUMNI_SPOTLIGHT_PATH', UPLOAD_BASE_PATH . 'AlumniSpotlight/');
define('UPLOAD_TEMP_PATH', UPLOAD_BASE_PATH . 'Temp/');

// File Upload Restrictions
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB for images
define('MAX_PDF_SIZE', 10 * 1024 * 1024); // 10MB for PDFs
define('ALLOWED_IMAGE_TYPES', ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']);
define('ALLOWED_DOCUMENT_TYPES', ['application/pdf']);
define('ALLOWED_EXTENSIONS', ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'webp']);

// Security Settings
define('API_SECRET_KEY', 'sk_alumni_4K8vP3nQ9xR2mL7wY5jH1aB6');
define('JWT_SECRET_KEY', 'jwt_secret_key_change_in_production');
define('JWT_EXPIRATION', 3600 * 24); // 24 hours

// Application Settings
define('APP_NAME', 'CUTMAP Alumni Portal');
define('APP_VERSION', '2.0.0');
define('TIMEZONE', 'Asia/Kolkata');

// Set timezone
date_default_timezone_set(TIMEZONE);

// Error Reporting (disable in production)
error_reporting(0);
ini_set('display_errors', 0);

// Create upload directories if they don't exist
$uploadDirs = [
    UPLOAD_BASE_PATH,
    UPLOAD_PHOTOS_PATH,
    UPLOAD_ALUMNI_TALK_PATH,
    UPLOAD_ALUMNI_TALK_PATH . 'Banners/',
    UPLOAD_ALUMNI_TALK_PATH . 'Galleries/',
    UPLOAD_ALUMNI_SPOTLIGHT_PATH,
    UPLOAD_ALUMNI_SPOTLIGHT_PATH . 'Photos/',
    UPLOAD_ALUMNI_SPOTLIGHT_PATH . 'Galleries/',
    UPLOAD_TEMP_PATH
];

foreach ($uploadDirs as $dir) {
    if (!file_exists($dir)) {
        mkdir($dir, 0755, true);
    }
}
