<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../models/AcademicInformation.php';
require_once __DIR__ . '/../../utils/Response.php';
require_once __DIR__ . '/../../utils/Validator.php';

Response::setCorsHeaders();

try {
    $database = new Database();
    $db = $database->getConnection();
    $academicModel = new AcademicInformation($db);
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $data = $academicModel->getAll();
        Response::success($data, 'Academic information retrieved successfully');

    } elseif ($method === 'POST') {
        require_once __DIR__ . '/../../middleware/AuthMiddleware.php';
        AuthMiddleware::authenticate(['admin', 'cadmin', 'alumni-manager']);
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        $requiredFields = ['school', 'department', 'programme'];
        $errors = Validator::validateRequired($input, $requiredFields);
        if (!empty($errors)) { Response::error('Validation failed', 400, $errors); }

        $id = $academicModel->create(
            $input['school'],
            $input['department'],
            $input['programme']
        );

        if ($id) {
            Response::success(['id' => $id], 'Academic information created successfully', 201);
        } else {
            Response::error('Failed to create academic information', 500);
        }

    } elseif ($method === 'PUT') {
        require_once __DIR__ . '/../../middleware/AuthMiddleware.php';
        AuthMiddleware::authenticate(['admin', 'cadmin', 'alumni-manager']);
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        $requiredFields = ['id', 'school', 'department', 'programme'];
        $errors = Validator::validateRequired($input, $requiredFields);
        if (!empty($errors)) { Response::error('Validation failed', 400, $errors); }

        if ($academicModel->update($input['id'], $input['school'], $input['department'], $input['programme'])) {
            Response::success(null, 'Academic information updated successfully');
        } else {
            Response::error('Failed to update academic information', 500);
        }

    } elseif ($method === 'DELETE') {
        require_once __DIR__ . '/../../middleware/AuthMiddleware.php';
        AuthMiddleware::authenticate(['admin', 'cadmin', 'alumni-manager']);
        
        $id = isset($_GET['id']) ? $_GET['id'] : null;
        if (!$id) {
            // Also check raw input for DELETE body
            $input = json_decode(file_get_contents('php://input'), true);
            $id = $input['id'] ?? null;
        }

        if (!$id) { Response::error('ID is required', 400); }

        if ($academicModel->delete($id)) {
            Response::success(null, 'Academic information deleted successfully');
        } else {
            Response::error('Failed to delete academic information', 500);
        }
        
    } elseif ($method === 'OPTIONS') {
        Response::success(null);
    } else {
        Response::error('Method not allowed', 405);
    }
} catch (Exception $e) {
    error_log("Academic API Error: " . $e->getMessage());
    Response::error('Internal server error', 500);
}
