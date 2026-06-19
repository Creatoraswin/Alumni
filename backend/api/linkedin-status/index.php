<?php
/**
 * LinkedIn Status API - GET all / POST CRUD
 */
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../models/LinkedInStatus.php';
require_once __DIR__ . '/../../utils/Response.php';
require_once __DIR__ . '/../../utils/Validator.php';

Response::setCorsHeaders();

try {
    $database = new Database();
    $db = $database->getConnection();
    $linkedInModel = new LinkedInStatus($db);
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        if (isset($_GET['action'])) {
            switch ($_GET['action']) {
                case 'statistics': Response::success($linkedInModel->getStatistics(), 'Statistics retrieved'); break;
                case 'statuses': Response::success($linkedInModel->getAllStatuses(), 'Statuses retrieved'); break;
                case 'with_linkedin': Response::success($linkedInModel->getWithLinkedIn(), 'Records retrieved'); break;
                case 'without_linkedin': Response::success($linkedInModel->getWithoutLinkedIn(), 'Records retrieved'); break;
                case 'by_status':
                    if (!isset($_GET['status'])) { Response::error('Status required', 400); }
                    Response::success($linkedInModel->getByStatus($_GET['status']), 'Records retrieved'); break;
                default: Response::error('Invalid action', 400);
            }
        } else {
            Response::success($linkedInModel->getAll(), 'LinkedIn statuses retrieved');
        }

    } elseif ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);

        if (isset($input['action']) && $input['action'] === 'bulk_upload' && isset($input['records'])) {
            $inserted = $linkedInModel->bulkCreate($input['records']);
            Response::success(['inserted' => $inserted, 'total' => count($input['records'])],
                "Inserted $inserted out of " . count($input['records']) . " records");

        } elseif (isset($input['action']) && $input['action'] === 'update_status') {
            if (!isset($input['registration_no']) || !isset($input['status'])) { Response::error('Registration number and status required', 400); }
            $success = $linkedInModel->updateStatus($input['registration_no'], $input['status']);
            if ($success) { Response::success(null, 'Status updated'); } else { Response::error('Failed to update', 500); }

        } elseif (isset($input['action']) && $input['action'] === 'update') {
            if (!isset($input['registration_no']) || !isset($input['updates'])) { Response::error('Registration number and updates required', 400); }
            $success = $linkedInModel->update($input['registration_no'], $input['updates']);
            if ($success) { Response::success(null, 'Record updated'); } else { Response::error('Failed to update', 500); }

        } elseif (isset($input['action']) && $input['action'] === 'delete') {
            if (!isset($input['registration_no'])) { Response::error('Registration number required', 400); }
            $success = $linkedInModel->delete($input['registration_no']);
            if ($success) { Response::success(null, 'Record deleted'); } else { Response::error('Failed to delete', 500); }

        } else {
            $requiredFields = ['registration_no', 'name'];
            $errors = Validator::validateRequired($input, $requiredFields);
            if (!empty($errors)) { Response::error('Validation failed', 400, $errors); }
            $data = [
                'registration_no' => Validator::sanitizeString($input['registration_no']),
                'name' => Validator::sanitizeString($input['name']),
                'linkedin_id' => Validator::sanitizeString($input['linkedin_id'] ?? ''),
                'current_status' => Validator::sanitizeString($input['current_status'] ?? '')
            ];
            $id = $linkedInModel->create($data);
            if ($id) { Response::success(['id' => $id], 'Record created', 201); }
            else { Response::error('Failed to create record', 500); }
        }
    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log('LinkedIn status API error: ' . $e->getMessage());
    Response::error('Operation failed: ' . $e->getMessage(), 500);
}
