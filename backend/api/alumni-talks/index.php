<?php
/**
 * Alumni Talks API - GET all / POST create/update/delete
 */
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../models/AlumniTalk.php';
require_once __DIR__ . '/../../utils/Response.php';
require_once __DIR__ . '/../../utils/Validator.php';

Response::setCorsHeaders();

function invalidateTalksCache() {
    if (class_exists('Redis')) {
        try {
            $redis = new Redis();
            if ($redis->connect('127.0.0.1', 6379)) {
                $redis->del('alumni_talks_all');
            }
        } catch (Exception $e) {
            error_log('Redis invalidation failed: ' . $e->getMessage());
        }
    }
}

try {
    $database = new Database();
    $db = $database->getConnection();
    $talkModel = new AlumniTalk($db);
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $cacheKey = 'alumni_talks_all';
        $cachedData = false;
        $redis = null;
        $bypassCache = isset($_GET['nocache']) && $_GET['nocache'] === 'true';

        // Try to connect to Redis if available
        if (class_exists('Redis') && !$bypassCache) {
            try {
                $redis = new Redis();
                if ($redis->connect('127.0.0.1', 6379)) {
                    $cachedData = $redis->get($cacheKey);
                }
            } catch (Exception $e) {
                error_log('Redis connection failed: ' . $e->getMessage());
            }
        }

        if ($cachedData) {
            $talks = json_decode($cachedData, true);
        } else {
            $talks = $talkModel->getAll();
            foreach ($talks as &$talk) {
                if (isset($talk['date_of_event'])) {
                    $talk['date_of_event'] = Validator::convertDateToDisplay($talk['date_of_event']);
                }
            }
            
            // Save to Redis if connected
            if (!$redis && class_exists('Redis')) {
                try {
                    $redis = new Redis();
                    $redis->connect('127.0.0.1', 6379);
                } catch (Exception $e) {}
            }
            if ($redis && $redis->isConnected()) {
                $redis->setex($cacheKey, 3600, json_encode($talks));
            }
        }
        
        Response::success($talks, 'Alumni talks retrieved successfully');

    } elseif ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);

        if (isset($input['action'])) {
            if ($input['action'] === 'create' && isset($input['talk'])) {
                $data = [
                    'date_of_event' => $input['talk']['date_of_event'] ?? '',
                    'name_of_alumni' => Validator::sanitizeString($input['talk']['name_of_alumni'] ?? ''),
                    'school' => Validator::sanitizeString($input['talk']['school'] ?? ''),
                    'department' => Validator::sanitizeString($input['talk']['department'] ?? ''),
                    'registration_no' => Validator::sanitizeString($input['talk']['registration_no'] ?? ''),
                    'banner_photo_url' => Validator::sanitizeString($input['talk']['banner_photo_url'] ?? ''),
                    'talk_on' => Validator::sanitizeString($input['talk']['talk_on'] ?? ''),
                    'gallery_link' => Validator::sanitizeString($input['talk']['gallery_link'] ?? '')
                ];
                $id = $talkModel->create($data);
                if ($id) {
                    invalidateTalksCache();
                    Response::success(['id' => $id], 'Alumni talk created successfully', 201);
                }
                else { Response::error('Failed to create alumni talk', 500); }

            } elseif ($input['action'] === 'update' && isset($input['criteria']) && isset($input['updates'])) {
                $talk = null;
                if (isset($input['criteria']['id'])) { $talk = $talkModel->getById($input['criteria']['id']); }
                else { $talk = $talkModel->findByCriteria($input['criteria']); }
                if (!$talk) { Response::error('Alumni talk not found', 404); }
                $success = $talkModel->update($talk['id'], $input['updates']);
                if ($success) {
                    invalidateTalksCache();
                    Response::success(null, 'Alumni talk updated successfully');
                }
                else { Response::error('Failed to update alumni talk', 500); }

            } elseif ($input['action'] === 'delete' && isset($input['criteria'])) {
                $talk = null;
                if (isset($input['criteria']['id'])) { $talk = $talkModel->getById($input['criteria']['id']); }
                else { $talk = $talkModel->findByCriteria($input['criteria']); }
                if (!$talk) { Response::error('Alumni talk not found', 404); }
                $success = $talkModel->delete($talk['id']);
                if ($success) {
                    invalidateTalksCache();
                    Response::success(null, 'Alumni talk deleted successfully');
                }
                else { Response::error('Failed to delete alumni talk', 500); }
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
    error_log('Alumni talks API error: ' . $e->getMessage());
    Response::error('Operation failed: ' . $e->getMessage(), 500);
}
