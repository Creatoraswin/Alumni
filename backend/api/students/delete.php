<?php
/**
 * Delete Student API
 */
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../models/Student.php';
require_once __DIR__ . '/../../utils/Response.php';

Response::setCorsHeaders();

try {
    $method = $_SERVER['REQUEST_METHOD'];
    if ($method !== 'DELETE' && $method !== 'POST') {
        Response::error('Method not allowed', 405);
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!isset($input['registrationNo']) && !isset($input['registration_no'])) {
        Response::error('Registration number is required', 400);
    }
    $registrationNo = $input['registrationNo'] ?? $input['registration_no'];

    $database = new Database();
    $db = $database->getConnection();
    $studentModel = new Student($db);

    $success = $studentModel->delete($registrationNo);
    if ($success) {
        Response::success(null, 'Student deleted successfully');
    } else {
        Response::error('Failed to delete student', 500);
    }

} catch (Exception $e) {
    error_log('Delete student error: ' . $e->getMessage());
    Response::error('Delete failed: ' . $e->getMessage(), 500);
}
