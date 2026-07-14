<?php
/**
 * Alumni Team API - GET all / POST create/update/delete
 */
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../models/AlumniTeam.php';
require_once __DIR__ . '/../../utils/Response.php';
require_once __DIR__ . '/../../utils/Validator.php';

Response::setCorsHeaders();

try {
    $database = new Database();
    $db = $database->getConnection();
    $teamModel = new AlumniTeam($db);
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $members = $teamModel->getAll();
        Response::success($members, 'Alumni team retrieved successfully');

    } elseif ($method === 'POST') {
        require_once __DIR__ . '/../../middleware/AuthMiddleware.php';
        AuthMiddleware::authenticate(['admin', 'alumni-manager']);

        $input = json_decode(file_get_contents('php://input'), true);

        if (isset($input['action'])) {
            if ($input['action'] === 'create' && isset($input['member'])) {
                $data = [
                    'photo_url'   => Validator::sanitizeString($input['member']['photo_url'] ?? ''),
                    'name'        => Validator::sanitizeString($input['member']['name'] ?? ''),
                    'school'      => Validator::sanitizeString($input['member']['school'] ?? ''),
                    'branch'      => Validator::sanitizeString($input['member']['branch'] ?? ''),
                    'designation' => Validator::sanitizeString($input['member']['designation'] ?? ''),
                    'writeup'     => Validator::sanitizeString($input['member']['writeup'] ?? ''),
                    'sort_order'  => (int)($input['member']['sort_order'] ?? 0),
                ];
                if (empty($data['name'])) {
                    Response::error('Name is required', 400);
                }
                $id = $teamModel->create($data);
                if ($id) { Response::success(['id' => $id], 'Team member created successfully', 201); }
                else { Response::error('Failed to create team member', 500); }

            } elseif ($input['action'] === 'update' && isset($input['id']) && isset($input['updates'])) {
                $member = $teamModel->getById((int)$input['id']);
                if (!$member) { Response::error('Team member not found', 404); }
                $success = $teamModel->update((int)$input['id'], $input['updates']);
                if ($success) { Response::success(null, 'Team member updated successfully'); }
                else { Response::error('Failed to update team member', 500); }

            } elseif ($input['action'] === 'delete' && isset($input['id'])) {
                $member = $teamModel->getById((int)$input['id']);
                if (!$member) { Response::error('Team member not found', 404); }
                $success = $teamModel->delete((int)$input['id']);
                if ($success) { Response::success(null, 'Team member deleted successfully'); }
                else { Response::error('Failed to delete team member', 500); }

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
    error_log('Alumni team API error: ' . $e->getMessage());
    Response::error('Operation failed: ' . $e->getMessage(), 500);
}
