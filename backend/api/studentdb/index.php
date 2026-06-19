<?php
/**
 * StudentDB API - GET all / POST CRUD / bulk upload
 */
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../models/StudentDB.php';
require_once __DIR__ . '/../../utils/Response.php';
require_once __DIR__ . '/../../utils/Validator.php';

Response::setCorsHeaders();

try {
    $database = new Database();
    $db = $database->getConnection();
    $studentDBModel = new StudentDB($db);
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        if (isset($_GET['action'])) {
            switch ($_GET['action']) {
                case 'batches': Response::success($studentDBModel->getAllBatches(), 'Batches retrieved'); break;
                case 'programs': Response::success($studentDBModel->getAllPrograms(), 'Programs retrieved'); break;
                case 'statistics': Response::success($studentDBModel->getStatistics(), 'Statistics retrieved'); break;
                case 'by_batch':
                    if (!isset($_GET['batch'])) { Response::error('Batch required', 400); }
                    Response::success($studentDBModel->getByBatch($_GET['batch']), 'Students retrieved'); break;
                case 'by_program':
                    if (!isset($_GET['program'])) { Response::error('Program required', 400); }
                    Response::success($studentDBModel->getByProgram($_GET['program']), 'Students retrieved'); break;
                case 'by_year':
                    if (!isset($_GET['year'])) { Response::error('Year required', 400); }
                    Response::success($studentDBModel->getByPassoutYear($_GET['year']), 'Students retrieved'); break;
                case 'check':
                    if (!isset($_GET['registration_no'])) { Response::error('Registration number required', 400); }
                    Response::success(['exists' => $studentDBModel->exists($_GET['registration_no'])], 'Check completed'); break;
                default: Response::error('Invalid action', 400);
            }
        } else {
            Response::success($studentDBModel->getAll(), 'Students retrieved successfully');
        }

    } elseif ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);

        if (isset($input['action']) && $input['action'] === 'bulk_upload' && isset($input['students'])) {
            $students = $input['students'];
            if (!is_array($students) || empty($students)) { Response::error('Invalid students data', 400); }
            $inserted = $studentDBModel->bulkCreate($students);
            Response::success(['inserted' => $inserted, 'total' => count($students)],
                "Successfully inserted $inserted out of " . count($students) . " students");

        } elseif (isset($input['action']) && $input['action'] === 'update') {
            if (!isset($input['registration_no']) || !isset($input['updates'])) { Response::error('Registration number and updates required', 400); }
            $success = $studentDBModel->update($input['registration_no'], $input['updates']);
            if ($success) { Response::success(null, 'Student updated'); } else { Response::error('Failed to update', 500); }

        } elseif (isset($input['action']) && $input['action'] === 'delete') {
            if (!isset($input['registration_no'])) { Response::error('Registration number required', 400); }
            $success = $studentDBModel->delete($input['registration_no']);
            if ($success) { Response::success(null, 'Student deleted'); } else { Response::error('Failed to delete', 500); }

        } else {
            $requiredFields = ['registration_no', 'name', 'batch', 'program', 'branch', 'passout_year'];
            $errors = Validator::validateRequired($input, $requiredFields);
            if (!empty($errors)) { Response::error('Validation failed', 400, $errors); }

            $data = [
                'registration_no' => Validator::sanitizeString($input['registration_no']),
                'name' => Validator::sanitizeString($input['name']),
                'batch' => Validator::sanitizeString($input['batch']),
                'program' => Validator::sanitizeString($input['program']),
                'branch' => Validator::sanitizeString($input['branch']),
                'passout_year' => (int) $input['passout_year']
            ];
            $id = $studentDBModel->create($data);
            if ($id) { Response::success(['id' => $id], 'Student created', 201); }
            else { Response::error('Failed to create student', 500); }
        }
    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log('StudentDB API error: ' . $e->getMessage());
    Response::error('Operation failed: ' . $e->getMessage(), 500);
}
