<?php
/**
 * Students API - GET all / POST create
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
        $showAll = isset($_GET['showAll']) && $_GET['showAll'] === 'true';
        $students = $studentModel->getAll($showAll);

        foreach ($students as &$student) {
            if (isset($student['dob'])) {
                $student['dob'] = Validator::convertDateToDisplay($student['dob']);
            }
        }
        Response::success($students, 'Students retrieved successfully');

    } elseif ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $requiredFields = ['registration_no', 'name', 'email'];
        $errors = Validator::validateRequired($input, $requiredFields);
        if (!empty($errors)) { Response::error('Validation failed', 400, $errors); }

        $data = [
            'registration_no' => Validator::sanitizeString($input['registration_no']),
            'name' => Validator::sanitizeString($input['name']),
            'email' => Validator::sanitizeString($input['email'] ?? ''),
            'personal_email' => Validator::sanitizeString($input['personal_email'] ?? ''),
            'mobile_no' => Validator::sanitizeString($input['mobile_no'] ?? ''),
            'dob' => $input['dob'] ?? null,
            'school' => Validator::sanitizeString($input['school'] ?? ''),
            'programme' => Validator::sanitizeString($input['programme'] ?? ''),
            'year_of_graduation' => (int) ($input['year_of_graduation'] ?? 0),
            'current_position' => Validator::sanitizeString($input['current_position'] ?? ''),
            'designation' => Validator::sanitizeString($input['designation'] ?? ''),
            'organisation' => Validator::sanitizeString($input['organisation'] ?? ''),
            'place_of_work' => Validator::sanitizeString($input['place_of_work'] ?? ''),
            'present_occupation' => Validator::sanitizeString($input['present_occupation'] ?? ''),
            'university_name' => Validator::sanitizeString($input['university_name'] ?? ''),
            'area_of_study' => Validator::sanitizeString($input['area_of_study'] ?? ''),
            'area_of_interest' => Validator::sanitizeString($input['area_of_interest'] ?? ''),
            'location' => Validator::sanitizeString($input['location'] ?? ''),
            'address' => Validator::sanitizeString($input['address'] ?? ''),
            'linkedin_id' => Validator::sanitizeString($input['linkedin_id'] ?? ''),
            'photo_url' => Validator::sanitizeString($input['photo_url'] ?? ''),
            'feedback' => Validator::sanitizeString($input['feedback'] ?? ''),
            'status' => $input['status'] ?? 'Pending'
        ];

        $id = $studentModel->create($data);
        if ($id) {
            try {
                require_once __DIR__ . '/../../models/LinkedInStatus.php';
                $linkedInModel = new LinkedInStatus($db);
                $linkedInModel->createFromRegistration($data['registration_no'], $data['name'], $data['linkedin_id']);
            } catch (Exception $e) {
                error_log('Failed to create LinkedIn status: ' . $e->getMessage());
            }
            Response::success(['id' => $id], 'Student created successfully', 201);
        } else {
            Response::error('Failed to create student', 500);
        }
    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log('Students API error: ' . $e->getMessage());
    Response::error('Operation failed: ' . $e->getMessage(), 500);
}
