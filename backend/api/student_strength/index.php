<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../models/StudentStrength.php';
require_once __DIR__ . '/../../utils/Response.php';
require_once __DIR__ . '/../../utils/Validator.php';

Response::setCorsHeaders();

try {
    $database = new Database();
    $db = $database->getConnection();
    $model = new StudentStrength($db);
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $data = $model->getAll();
        Response::success($data, 'Student strength retrieved successfully');

    } elseif ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);

        // Check for Bulk action
        if (isset($_GET['action']) && $_GET['action'] === 'bulk') {
            if (!is_array($input) || empty($input)) {
                Response::error('Invalid payload. Expected an array of records.', 400);
            }

            // Extract all registration_nos to check for duplicates in DB
            $regNos = [];
            foreach ($input as $row) {
                if (isset($row['registration_no'])) {
                    $regNos[] = trim($row['registration_no']);
                }
            }

            // Also check for duplicates within the uploaded file itself
            $duplicatesInFile = array_diff_assoc($regNos, array_unique($regNos));

            $duplicatesInDB = $model->bulkCheckDuplicates($regNos);

            $allDuplicates = array_unique(array_merge($duplicatesInFile, $duplicatesInDB));

            if (!empty($allDuplicates)) {
                Response::error('Bulk upload failed due to repeating registration numbers.', 400, $allDuplicates);
            }

            // If no duplicates, insert them all
            $inserted = 0;
            foreach ($input as $row) {
                $reg = trim($row['registration_no'] ?? '');
                $name = trim($row['name'] ?? '');
                $batch = trim($row['batch'] ?? '');
                $school = trim($row['school'] ?? '');
                $program = trim($row['program'] ?? '');
                $branch = trim($row['branch'] ?? '');
                $passout = isset($row['passout_year']) ? intval($row['passout_year']) : null;

                if (!empty($reg) && !empty($name)) {
                    $model->create($reg, $name, $batch, $school, $program, $branch, $passout);
                    $inserted++;
                }
            }
            Response::success(['inserted' => $inserted], "Bulk upload successful. Inserted $inserted records.", 201);
            exit();
        }

        // Normal POST
        $requiredFields = ['registration_no', 'name'];
        $errors = Validator::validateRequired($input, $requiredFields);
        if (!empty($errors)) { Response::error('Validation failed', 400, $errors); }

        if ($model->exists($input['registration_no'])) {
            Response::error('Registration number already exists.', 400);
        }

        $id = $model->create(
            $input['registration_no'],
            $input['name'],
            $input['batch'] ?? null,
            $input['school'] ?? null,
            $input['program'] ?? null,
            $input['branch'] ?? null,
            $input['passout_year'] ?? null
        );

        if ($id) {
            Response::success(['id' => $id], 'Record created successfully', 201);
        } else {
            Response::error('Failed to create record', 500);
        }

    } elseif ($method === 'PUT') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $requiredFields = ['id', 'registration_no', 'name'];
        $errors = Validator::validateRequired($input, $requiredFields);
        if (!empty($errors)) { Response::error('Validation failed', 400, $errors); }

        if ($model->update(
            $input['id'],
            $input['registration_no'],
            $input['name'],
            $input['batch'] ?? null,
            $input['school'] ?? null,
            $input['program'] ?? null,
            $input['branch'] ?? null,
            $input['passout_year'] ?? null
        )) {
            Response::success(null, 'Record updated successfully');
        } else {
            Response::error('Failed to update record', 500);
        }

    } elseif ($method === 'DELETE') {
        $id = isset($_GET['id']) ? $_GET['id'] : null;
        if (!$id) {
            $input = json_decode(file_get_contents('php://input'), true);
            $id = $input['id'] ?? null;
        }

        if (!$id) { Response::error('ID is required', 400); }

        if ($model->delete($id)) {
            Response::success(null, 'Record deleted successfully');
        } else {
            Response::error('Failed to delete record', 500);
        }
        
    } elseif ($method === 'OPTIONS') {
        Response::success(null);
    } else {
        Response::error('Method not allowed', 405);
    }
} catch (Exception $e) {
    error_log("Student Strength API Error: " . $e->getMessage());
    Response::error('Internal server error', 500);
}
