<?php
/**
 * Student Coordinators API - GET all / POST create/update/delete
 */
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../models/StudentCoordinator.php';
require_once __DIR__ . '/../../utils/Response.php';
require_once __DIR__ . '/../../utils/Validator.php';

Response::setCorsHeaders();

try {
    $database = new Database();
    $db = $database->getConnection();
    $coordModel = new StudentCoordinator($db);
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $coords = $coordModel->getAll();
        Response::success($coords, 'Student coordinators retrieved successfully');

    } elseif ($method === 'POST') {
        require_once __DIR__ . '/../../middleware/AuthMiddleware.php';
        AuthMiddleware::authenticate(['admin', 'alumni-manager']);

        $input = json_decode(file_get_contents('php://input'), true);

        if (isset($input['action'])) {
            if ($input['action'] === 'create' && isset($input['coordinator'])) {
                $data = [
                    'photo_url'       => Validator::sanitizeString($input['coordinator']['photo_url'] ?? ''),
                    'name'            => Validator::sanitizeString($input['coordinator']['name'] ?? ''),
                    'school'          => Validator::sanitizeString($input['coordinator']['school'] ?? ''),
                    'branch'          => Validator::sanitizeString($input['coordinator']['branch'] ?? ''),
                    'registration_no' => Validator::sanitizeString($input['coordinator']['registration_no'] ?? ''),
                    'sort_order'      => (int)($input['coordinator']['sort_order'] ?? 0),
                ];
                if (empty($data['name'])) {
                    Response::error('Name is required', 400);
                }
                $id = $coordModel->create($data);
                if ($id) { Response::success(['id' => $id], 'Student coordinator created successfully', 201); }
                else { Response::error('Failed to create student coordinator', 500); }

            } elseif ($input['action'] === 'update' && isset($input['id']) && isset($input['updates'])) {
                $coord = $coordModel->getById((int)$input['id']);
                if (!$coord) { Response::error('Student coordinator not found', 404); }
                $success = $coordModel->update((int)$input['id'], $input['updates']);
                if ($success) { Response::success(null, 'Student coordinator updated successfully'); }
                else { Response::error('Failed to update student coordinator', 500); }

            } elseif ($input['action'] === 'delete' && isset($input['id'])) {
                $coord = $coordModel->getById((int)$input['id']);
                if (!$coord) { Response::error('Student coordinator not found', 404); }
                $success = $coordModel->delete((int)$input['id']);
                if ($success) { Response::success(null, 'Student coordinator deleted successfully'); }
                else { Response::error('Failed to delete student coordinator', 500); }

            } else {
                Response::error('Invalid action or missing parameters', 400);
            }
        } else {
            Response::error('Action is required', 400);
        }
    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log('Student coordinators API error: ' . $e->getMessage());
    Response::error('Operation failed: ' . $e->getMessage(), 500);
}
