<?php
/**
 * Authentication API - Login
 */
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../models/User.php';
require_once __DIR__ . '/../../utils/Response.php';

Response::setCorsHeaders();

try {
    $method = $_SERVER['REQUEST_METHOD'];
    if ($method !== 'POST') { Response::error('Method not allowed', 405); }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!isset($input['username']) || !isset($input['password'])) {
        Response::error('Username and password are required', 400);
    }

    $database = new Database();
    $db = $database->getConnection();
    $userModel = new User($db);
    $user = $userModel->authenticate($input['username'], $input['password']);

    if ($user) {
        require_once __DIR__ . '/../../utils/JwtHandler.php';
        $jwtHandler = new JwtHandler(JWT_SECRET_KEY);
        $payload = [
            'id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role'] ?? 'student',
            'iat' => time(),
            'exp' => time() + JWT_EXPIRATION
        ];
        $token = $jwtHandler->encode($payload);
        Response::success(['user' => $user, 'token' => $token], 'Login successful');
    } else {
        Response::error('Invalid username or password', 401);
    }

} catch (Exception $e) {
    error_log('Login error: ' . $e->getMessage());
    Response::error('Authentication failed: ' . $e->getMessage(), 500);
}
