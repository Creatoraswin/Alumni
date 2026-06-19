<?php
/**
 * LinkedIn Status CSV Upload API
 */
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../models/LinkedInStatus.php';
require_once __DIR__ . '/../../utils/Response.php';
require_once __DIR__ . '/../../utils/Validator.php';

Response::setCorsHeaders();

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') { Response::error('Method not allowed', 405); }
    if (!isset($_FILES['file'])) { Response::error('No file uploaded', 400); }

    $file = $_FILES['file'];
    $fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if ($fileExtension !== 'csv') { Response::error('Only CSV files are allowed', 400); }
    if ($file['size'] > 10 * 1024 * 1024) { Response::error('File size exceeds 10MB', 400); }

    $handle = fopen($file['tmp_name'], 'r');
    if ($handle === false) { Response::error('Failed to read CSV file', 500); }

    $headers = fgetcsv($handle);
    if ($headers === false) { fclose($handle); Response::error('CSV file is empty or invalid', 400); }

    $headers = array_map(function($h) { return strtolower(trim(str_replace("\xEF\xBB\xBF", '', $h))); }, $headers);

    $requiredHeaders = ['registration no', 'name'];
    foreach ($requiredHeaders as $required) {
        if (!in_array($required, $headers)) { fclose($handle); Response::error("Missing column: $required", 400); }
    }

    $regNoIndex = array_search('registration no', $headers);
    $nameIndex = array_search('name', $headers);
    $linkedInIndex = array_search('linkedin id', $headers);
    $statusIndex = array_search('current status', $headers);

    $records = []; $errors = []; $rowNumber = 1;
    while (($row = fgetcsv($handle)) !== false) {
        $rowNumber++;
        if (empty(array_filter($row))) { continue; }
        $registrationNo = trim($row[$regNoIndex] ?? '');
        $name = trim($row[$nameIndex] ?? '');
        if (empty($registrationNo)) { $errors[] = "Row $rowNumber: Registration number required"; continue; }
        if (empty($name)) { $errors[] = "Row $rowNumber: Name required"; continue; }
        $records[] = [
            'registration_no' => Validator::sanitizeString($registrationNo),
            'name' => Validator::sanitizeString($name),
            'linkedin_id' => Validator::sanitizeString($linkedInIndex !== false ? trim($row[$linkedInIndex] ?? '') : ''),
            'current_status' => Validator::sanitizeString($statusIndex !== false ? trim($row[$statusIndex] ?? '') : '')
        ];
    }
    fclose($handle);

    if (!empty($errors)) { Response::error('CSV validation failed', 400, $errors); }
    if (empty($records)) { Response::error('No valid records found', 400); }

    $database = new Database();
    $db = $database->getConnection();
    $linkedInModel = new LinkedInStatus($db);
    $inserted = $linkedInModel->bulkCreate($records);

    Response::success(['inserted' => $inserted, 'total' => count($records), 'failed' => count($records) - $inserted],
        "Imported $inserted out of " . count($records) . " records");

} catch (Exception $e) {
    error_log('CSV upload error: ' . $e->getMessage());
    Response::error('Upload failed: ' . $e->getMessage(), 500);
}
