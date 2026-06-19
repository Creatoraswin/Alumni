<?php
/**
 * Alumni Spotlight API - GET all / POST create/update/delete
 */
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../models/AlumniSpotlight.php';
require_once __DIR__ . '/../../utils/Response.php';
require_once __DIR__ . '/../../utils/Validator.php';

Response::setCorsHeaders();

try {
    $database = new Database();
    $db = $database->getConnection();
    $spotlightModel = new AlumniSpotlight($db);
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $showAll = isset($_GET['showAll']) && $_GET['showAll'] === 'true';
        $spotlights = $spotlightModel->getAll($showAll);
        foreach ($spotlights as &$spotlight) {
            if (isset($spotlight['date_added'])) {
                $spotlight['date_added'] = Validator::convertDateToDisplay($spotlight['date_added']);
            }
        }
        Response::success($spotlights, 'Alumni spotlights retrieved successfully');

    } elseif ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);

        if (isset($input['action'])) {
            if ($input['action'] === 'create' && isset($input['spotlight'])) {
                $data = [
                    'date_added' => $input['spotlight']['date_added'] ?? '',
                    'name_of_alumni' => Validator::sanitizeString($input['spotlight']['name_of_alumni'] ?? ''),
                    'year_of_graduation' => (int) ($input['spotlight']['year_of_graduation'] ?? 0),
                    'school' => Validator::sanitizeString($input['spotlight']['school'] ?? ''),
                    'department' => Validator::sanitizeString($input['spotlight']['department'] ?? ''),
                    'registration_no' => Validator::sanitizeString($input['spotlight']['registration_no'] ?? ''),
                    'current_position' => Validator::sanitizeString($input['spotlight']['current_position'] ?? ''),
                    'company_organization' => Validator::sanitizeString($input['spotlight']['company_organization'] ?? ''),
                    'photo_url' => Validator::sanitizeString($input['spotlight']['photo_url'] ?? ''),
                    'achievement_story' => Validator::sanitizeString($input['spotlight']['achievement_story'] ?? ''),
                    'gallery_link' => Validator::sanitizeString($input['spotlight']['gallery_link'] ?? ''),
                    'status' => $input['spotlight']['status'] ?? 'Pending'
                ];
                $id = $spotlightModel->create($data);
                if ($id) { Response::success(['id' => $id], 'Alumni spotlight created successfully', 201); }
                else { Response::error('Failed to create alumni spotlight', 500); }

            } elseif ($input['action'] === 'update' && isset($input['criteria']) && isset($input['updates'])) {
                $spotlight = null;
                if (isset($input['criteria']['id'])) { $spotlight = $spotlightModel->getById($input['criteria']['id']); }
                else { $spotlight = $spotlightModel->findByCriteria($input['criteria']); }
                if (!$spotlight) { Response::error('Alumni spotlight not found', 404); }
                $success = $spotlightModel->update($spotlight['id'], $input['updates']);
                if ($success) { Response::success(null, 'Alumni spotlight updated successfully'); }
                else { Response::error('Failed to update alumni spotlight', 500); }

            } elseif ($input['action'] === 'delete' && isset($input['criteria'])) {
                $spotlight = null;
                if (isset($input['criteria']['id'])) { $spotlight = $spotlightModel->getById($input['criteria']['id']); }
                else { $spotlight = $spotlightModel->findByCriteria($input['criteria']); }
                if (!$spotlight) { Response::error('Alumni spotlight not found', 404); }
                $success = $spotlightModel->delete($spotlight['id']);
                if ($success) { Response::success(null, 'Alumni spotlight deleted successfully'); }
                else { Response::error('Failed to delete alumni spotlight', 500); }
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
    error_log('Alumni spotlight API error: ' . $e->getMessage());
    Response::error('Operation failed: ' . $e->getMessage(), 500);
}
