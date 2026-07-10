<?php
/**
 * Update Student API
 */
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../models/Student.php';
require_once __DIR__ . '/../../utils/Response.php';
require_once __DIR__ . '/../../utils/Validator.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';

Response::setCorsHeaders();

try {
    $method = $_SERVER['REQUEST_METHOD'];
    if ($method !== 'PUT' && $method !== 'PATCH' && $method !== 'POST') {
        Response::error('Method not allowed', 405);
    }
    
    // Protect endpoint
    $payload = AuthMiddleware::authenticate(['admin', 'department', 'school', 'alumni-manager', 'cadmin']);

    $input = json_decode(file_get_contents('php://input'), true);
    if (!isset($input['registrationNo']) && !isset($input['registration_no'])) {
        Response::error('Registration number is required', 400);
    }
    if (!isset($input['updates'])) {
        Response::error('Updates are required', 400);
    }

    $registrationNo = $input['registrationNo'] ?? $input['registration_no'];

    $database = new Database();
    $db = $database->getConnection();
    $studentModel = new Student($db);

    $updates = [];
    foreach ($input['updates'] as $key => $value) {
        if (is_string($value)) {
            $updates[$key] = Validator::sanitizeString($value);
        } else {
            $updates[$key] = $value;
        }
    }

    $success = $studentModel->update($registrationNo, $updates);
    if ($success) {
        Response::success(null, 'Student updated successfully');
    } else {
        Response::error('Failed to update student', 500);
    }

} catch (Exception $e) {
    error_log('Update student error: ' . $e->getMessage());
    Response::error('Update failed: ' . $e->getMessage(), 500);
}
