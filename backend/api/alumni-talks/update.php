<?php
/**
 * Alumni Talks Update API - Updates by ID
 */
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../models/AlumniTalk.php';
require_once __DIR__ . '/../../utils/Response.php';
require_once __DIR__ . '/../../utils/Validator.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';

Response::setCorsHeaders();

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') { Response::error('Method not allowed', 405); }
    
    // Protect endpoint
    $payload = AuthMiddleware::authenticate(['admin', 'cadmin', 'department', 'school', 'alumni-manager']);

    $database = new Database();
    $db = $database->getConnection();
    $talkModel = new AlumniTalk($db);

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) { Response::error('Invalid JSON data', 400); }

    $id = $input['id'] ?? null;
    if (!$id) { Response::error('Talk ID is required', 400); }

    $existingTalk = $talkModel->getById($id);
    if (!$existingTalk) { Response::error('Alumni talk not found', 404); }

    $updates = [];
    if (isset($input['event_date'])) { $updates['date_of_event'] = Validator::convertDateToMysql($input['event_date']); }
    if (isset($input['name'])) { $updates['name_of_alumni'] = Validator::sanitizeString($input['name']); }
    if (isset($input['school'])) { $updates['school'] = Validator::sanitizeString($input['school']); }
    if (isset($input['department'])) { $updates['department'] = Validator::sanitizeString($input['department']); }
    if (isset($input['registration_no'])) { $updates['registration_no'] = Validator::sanitizeString($input['registration_no']); }
    if (isset($input['banner_photo_url'])) { $updates['banner_photo_url'] = Validator::sanitizeString($input['banner_photo_url']); }
    if (isset($input['talk_on'])) { $updates['talk_on'] = Validator::sanitizeString($input['talk_on']); }
    if (isset($input['gallery_link'])) { $updates['gallery_link'] = Validator::sanitizeString($input['gallery_link']); }

    if (empty($updates)) { Response::error('No valid fields to update', 400); }

    $success = $talkModel->update($id, $updates);
    if ($success) { Response::success(['id' => $id], 'Alumni talk updated successfully'); }
    else { Response::error('Failed to update alumni talk', 500); }

} catch (Exception $e) {
    error_log('Alumni talk update error: ' . $e->getMessage());
    Response::error('Operation failed: ' . $e->getMessage(), 500);
}
