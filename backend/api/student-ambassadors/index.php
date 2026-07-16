<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../models/StudentAmbassador.php';
require_once __DIR__ . '/../../utils/Response.php';
require_once __DIR__ . '/../../utils/Validator.php';

Response::setCorsHeaders();

try {
    $database = new Database();
    $db       = $database->getConnection();
    $model    = new StudentAmbassador($db);
    $method   = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        Response::success($model->getAll(), 'Student ambassadors retrieved successfully');

    } elseif ($method === 'POST') {
        require_once __DIR__ . '/../../middleware/AuthMiddleware.php';
        AuthMiddleware::authenticate(['admin', 'alumni-manager']);

        $input = json_decode(file_get_contents('php://input'), true);

        if (!isset($input['action'])) {
            Response::error('Action is required', 400);
        }

        if ($input['action'] === 'create' && isset($input['ambassador'])) {
            $a = $input['ambassador'];
            $data = [
                'photo_url'    => Validator::sanitizeString($a['photo_url']    ?? ''),
                'name'         => Validator::sanitizeString($a['name']         ?? ''),
                'school'       => Validator::sanitizeString($a['school']       ?? ''),
                'department'   => Validator::sanitizeString($a['department']   ?? ''),
                'phone'        => Validator::sanitizeString($a['phone']        ?? ''),
                'linkedin_id'  => Validator::sanitizeString($a['linkedin_id']  ?? ''),
                'instagram_id' => Validator::sanitizeString($a['instagram_id'] ?? ''),
                'sort_order'   => (int)($a['sort_order'] ?? 0),
            ];
            if (empty($data['name'])) Response::error('Name is required', 400);
            $id = $model->create($data);
            if ($id) Response::success(['id' => $id], 'Ambassador created successfully', 201);
            else Response::error('Failed to create ambassador', 500);

        } elseif ($input['action'] === 'update' && isset($input['id'], $input['updates'])) {
            if (!$model->getById((int)$input['id'])) Response::error('Ambassador not found', 404);
            $ok = $model->update((int)$input['id'], $input['updates']);
            if ($ok) Response::success(null, 'Ambassador updated successfully');
            else Response::error('Failed to update ambassador', 500);

        } elseif ($input['action'] === 'delete' && isset($input['id'])) {
            if (!$model->getById((int)$input['id'])) Response::error('Ambassador not found', 404);
            $ok = $model->delete((int)$input['id']);
            if ($ok) Response::success(null, 'Ambassador deleted successfully');
            else Response::error('Failed to delete ambassador', 500);

        } else {
            Response::error('Invalid action or missing parameters', 400);
        }

    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log('Student ambassadors API error: ' . $e->getMessage());
    Response::error('Operation failed: ' . $e->getMessage(), 500);
}
