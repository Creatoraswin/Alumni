<?php
/**
 * File Upload API
 * Handles photo, banner, gallery, and document uploads
 */
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/Response.php';
require_once __DIR__ . '/../../utils/FileUpload.php';

Response::setCorsHeaders();

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') { Response::error('Method not allowed', 405); }
    if (!isset($_FILES['file'])) { Response::error('No file uploaded', 400); }

    $type = $_POST['type'] ?? 'photo';
    $metadata = [];

    if (isset($_POST['registration_no'])) {
        $metadata['filename_base'] = $_POST['registration_no'];
    }

    $result = FileUpload::upload($_FILES['file'], $type, $metadata);

    if ($result['success']) {
        Response::success([
            'url' => $result['url'],
            'filename' => $result['filename']
        ], $result['message']);
    } else {
        Response::error($result['message'], 400);
    }

} catch (Exception $e) {
    error_log('Upload API error: ' . $e->getMessage());
    Response::error('Upload failed: ' . $e->getMessage(), 500);
}
