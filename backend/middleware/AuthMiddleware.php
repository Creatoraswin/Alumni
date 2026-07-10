<?php
/**
 * Authentication Middleware
 * 
 * Verifies JWT tokens and enforces access control
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../utils/JwtHandler.php';
require_once __DIR__ . '/../utils/Response.php';

class AuthMiddleware {
    
    /**
     * Authenticate request using JWT from Authorization header
     * 
     * @param array $allowedRoles Array of roles allowed to access. Empty array means any authenticated user.
     * @return array Decoded token payload
     */
    public static function authenticate($allowedRoles = []) {
        $headers = null;
        
        // Get Authorization header
        if (isset($_SERVER['Authorization'])) {
            $headers = trim($_SERVER["Authorization"]);
        } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) { // Nginx or fast CGI
            $headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
        } elseif (function_exists('apache_request_headers')) {
            $requestHeaders = apache_request_headers();
            $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
            if (isset($requestHeaders['Authorization'])) {
                $headers = trim($requestHeaders['Authorization']);
            }
        }
        
        if (empty($headers)) {
            Response::error('Authentication required. Missing Authorization header.', 401);
            exit;
        }
        
        if (!preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
            Response::error('Invalid Authorization header format. Expected "Bearer <token>"', 401);
            exit;
        }
        
        $token = $matches[1];
        
        $jwtHandler = new JwtHandler(JWT_SECRET_KEY);
        $payload = $jwtHandler->decode($token);
        
        if (!$payload) {
            Response::error('Invalid or expired token', 401);
            exit;
        }
        
        if (!empty($allowedRoles)) {
            $userRole = $payload['role'] ?? null;
            if (!$userRole || !in_array($userRole, $allowedRoles)) {
                Response::error('Access denied. Insufficient privileges.', 403);
                exit;
            }
        }
        
        return $payload;
    }
}
