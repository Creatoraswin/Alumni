<?php
/**
 * Users API
 * Handles CRUD operations for system users
 */
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../models/User.php';
require_once __DIR__ . '/../../utils/Response.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';

Response::setCorsHeaders();

// Only admin and cadmin can manage users
AuthMiddleware::authenticate(['admin', 'cadmin']);

try {
    $database = new Database();
    $db = $database->getConnection();
    $userModel = new User($db);

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'OPTIONS') {
        http_response_code(200);
        exit();
    }

    switch ($method) {
        case 'GET':
            // Fetch all users
            $users = $userModel->getAll();
            Response::success($users, 'Users fetched successfully');
            break;

        case 'POST':
            // Add a new user
            $input = json_decode(file_get_contents('php://input'), true);
            if (!isset($input['username']) || !isset($input['password']) || !isset($input['role'])) {
                Response::error('Username, password, and role are required', 400);
            }

            // Check if user exists
            if ($userModel->getByUsername($input['username'])) {
                Response::error('Username already exists', 409);
            }

            $userId = $userModel->create($input);
            if ($userId) {
                Response::success(['id' => $userId], 'User created successfully', 201);
            } else {
                Response::error('Failed to create user', 500);
            }
            break;

        case 'PUT':
            // Update a user
            $input = json_decode(file_get_contents('php://input'), true);
            if (!isset($input['username'])) {
                Response::error('Username is required for update', 400);
            }

            // Check if user exists
            if (!$userModel->getByUsername($input['username'])) {
                Response::error('User not found', 404);
            }

            if ($userModel->update($input)) {
                Response::success(null, 'User updated successfully');
            } else {
                Response::error('Failed to update user', 500);
            }
            break;

        case 'DELETE':
            // Delete a user
            $username = $_GET['username'] ?? '';
            if (empty($username)) {
                Response::error('Username is required for deletion', 400);
            }

            // Cannot delete admin if it's the last one (safety precaution), or at least don't delete 'admin'
            if ($username === 'admin') {
                Response::error('Cannot delete the primary admin account', 403);
            }

            if ($userModel->delete($username)) {
                Response::success(null, 'User deleted successfully');
            } else {
                Response::error('Failed to delete user', 500);
            }
            break;

        default:
            Response::error('Method not allowed', 405);
            break;
    }

} catch (Exception $e) {
    error_log('Users API Error: ' . $e->getMessage());
    Response::error('Internal server error: ' . $e->getMessage(), 500);
}
