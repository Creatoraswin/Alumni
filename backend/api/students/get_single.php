<?php
/**
 * Students API - GET single student by registration number
 */
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../models/Student.php';
require_once __DIR__ . '/../../utils/Response.php';
require_once __DIR__ . '/../../utils/Validator.php';

Response::setCorsHeaders();

try {
    $database = new Database();
    $db = $database->getConnection();
    $studentModel = new Student($db);
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        if (!isset($_GET['id']) || empty($_GET['id'])) {
            Response::error('Student ID (registration number) is required', 400);
            exit;
        }

        $id = Validator::sanitizeString($_GET['id']);
        $student = $studentModel->getByRegistrationNo($id);

        if ($student) {
            if (isset($student['dob'])) {
                $student['dob'] = Validator::convertDateToDisplay($student['dob']);
            }
            Response::success($student, 'Student retrieved successfully');
        } else {
            Response::error('Student not found', 404);
        }
    } else {
        Response::error('Method not allowed', 405);
    }
} catch (Exception $e) {
    error_log('Get Single Student API error: ' . $e->getMessage());
    Response::error('Operation failed: ' . $e->getMessage(), 500);
}
