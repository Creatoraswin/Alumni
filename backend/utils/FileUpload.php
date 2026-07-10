<?php
/**
 * File Upload Utility Class
 * 
 * Handles file uploads with validation and security
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/Validator.php';

class FileUpload
{
    public static function upload($file, $type, $metadata = [])
    {
        try {
            if (!isset($file) || $file['error'] === UPLOAD_ERR_NO_FILE) {
                throw new Exception('No file uploaded');
            }
            if ($file['error'] !== UPLOAD_ERR_OK) {
                throw new Exception(self::getUploadErrorMessage($file['error']));
            }

            $maxSize = (strpos($file['type'], 'pdf') !== false) ? MAX_PDF_SIZE : MAX_FILE_SIZE;
            if ($file['size'] > $maxSize) {
                $maxSizeMB = $maxSize / (1024 * 1024);
                throw new Exception("File size exceeds maximum allowed size of {$maxSizeMB}MB");
            }

            if (function_exists('finfo_open')) {
                $finfo = finfo_open(FILEINFO_MIME_TYPE);
                $mimeType = finfo_file($finfo, $file['tmp_name']);
                finfo_close($finfo);
            } else {
                $mimeType = mime_content_type($file['tmp_name']);
            }

            $allowedTypes = array_merge(ALLOWED_IMAGE_TYPES, ALLOWED_DOCUMENT_TYPES);
            if (!in_array($mimeType, $allowedTypes)) {
                throw new Exception('Invalid file type. Only images (JPG, PNG, GIF) and PDFs are allowed');
            }

            $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            if (!in_array($extension, ALLOWED_EXTENSIONS)) {
                throw new Exception('Invalid file extension');
            }

            $uploadPath = self::getUploadPath($type, $metadata);

            // Clean up any existing files with the same base name (e.g. old jpeg/png if we are webp)
            if (isset($metadata['filename_base']) && !empty($metadata['filename_base'])) {
                $filenameBase = preg_replace('/[^a-zA-Z0-9_-]/', '', $metadata['filename_base']);
                foreach (['jpg', 'jpeg', 'png', 'gif', 'webp'] as $ext) {
                    $existingFile = $uploadPath . $filenameBase . '.' . $ext;
                    if (file_exists($existingFile)) {
                        @unlink($existingFile);
                    }
                }
            }

            $timestamp = time();
            $randomString = bin2hex(random_bytes(8));
            
            // Check if GD webp is available and it's an image we want to convert
            $isImage = in_array($mimeType, ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']);
            $shouldConvertToWebp = $isImage && function_exists('imagewebp');

            if ($shouldConvertToWebp) {
                $targetExtension = 'webp';
            } else {
                $targetExtension = $extension;
            }

            if (isset($metadata['filename_base']) && !empty($metadata['filename_base'])) {
                $filenameBase = preg_replace('/[^a-zA-Z0-9_-]/', '', $metadata['filename_base']);
                $filename = "{$filenameBase}.{$targetExtension}";
            } else {
                $filename = "{$type}_{$timestamp}_{$randomString}.{$targetExtension}";
            }
            
            $filePath = $uploadPath . $filename;

            if ($shouldConvertToWebp) {
                // First save temporary/original file
                $tempOriginalPath = $uploadPath . 'temp_' . $timestamp . '_' . $randomString . '.' . $extension;
                if (!move_uploaded_file($file['tmp_name'], $tempOriginalPath)) {
                    throw new Exception('Failed to save uploaded file');
                }
                
                // Convert to WebP
                $converted = self::convertToWebp($tempOriginalPath, $filePath);
                
                if (!$converted) {
                    // Fall back to original format if conversion failed
                    if (isset($metadata['filename_base']) && !empty($metadata['filename_base'])) {
                        $filename = "{$filenameBase}.{$extension}";
                    } else {
                        $filename = "{$type}_{$timestamp}_{$randomString}.{$extension}";
                    }
                    $filePath = $uploadPath . $filename;
                    if (!rename($tempOriginalPath, $filePath)) {
                        @unlink($tempOriginalPath);
                        throw new Exception('Failed to save fallback uploaded file');
                    }
                } else {
                    @unlink($tempOriginalPath); // Clean up temp file
                }
            } else {
                if (!move_uploaded_file($file['tmp_name'], $filePath)) {
                    throw new Exception('Failed to save uploaded file');
                }
            }

            $webPath = str_replace(dirname(__DIR__, 2) . '/', '', $filePath);
            $webPath = str_replace('\\', '/', $webPath);

            return [
                'success' => true,
                'url' => '/' . $webPath,
                'filename' => $filename,
                'message' => 'File uploaded successfully'
            ];

        } catch (Exception $e) {
            return [
                'success' => false,
                'url' => null,
                'message' => $e->getMessage()
            ];
        }
    }

    private static function getUploadPath($type, $metadata)
    {
        switch ($type) {
            case 'photo':
            case 'student_photo':
                if (!is_dir(UPLOAD_PHOTOS_PATH)) {
                    mkdir(UPLOAD_PHOTOS_PATH, 0755, true);
                }
                return UPLOAD_PHOTOS_PATH;
            case 'alumni_talk_banner':
                return UPLOAD_ALUMNI_TALK_PATH . 'Banners/';
            case 'alumni_talk_report':
                if (!is_dir(UPLOAD_ALUMNI_TALK_PATH . 'Reports/')) {
                    mkdir(UPLOAD_ALUMNI_TALK_PATH . 'Reports/', 0755, true);
                }
                return UPLOAD_ALUMNI_TALK_PATH . 'Reports/';
            case 'alumni_talk_gallery':
                return UPLOAD_ALUMNI_TALK_PATH . 'Galleries/';
            case 'alumni_spotlight_photo':
                return UPLOAD_ALUMNI_SPOTLIGHT_PATH . 'Photos/';
            case 'alumni_spotlight_gallery':
                return UPLOAD_ALUMNI_SPOTLIGHT_PATH . 'Galleries/';
            default:
                return UPLOAD_TEMP_PATH;
        }
    }

    private static function getUploadErrorMessage($errorCode)
    {
        switch ($errorCode) {
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                return 'File size exceeds maximum allowed size';
            case UPLOAD_ERR_PARTIAL:
                return 'File was only partially uploaded';
            case UPLOAD_ERR_NO_TMP_DIR:
                return 'Missing temporary folder';
            case UPLOAD_ERR_CANT_WRITE:
                return 'Failed to write file to disk';
            case UPLOAD_ERR_EXTENSION:
                return 'File upload stopped by extension';
            default:
                return 'Unknown upload error';
        }
    }

    public static function delete($url)
    {
        if (empty($url)) {
            return false;
        }
        $filePath = dirname(__DIR__, 2) . str_replace('/', DIRECTORY_SEPARATOR, $url);
        if (file_exists($filePath)) {
            return unlink($filePath);
        }
        return false;
    }

    private static function convertToWebp($sourcePath, $destinationPath, $quality = 80)
    {
        if (!function_exists('imagewebp')) {
            return false;
        }

        $info = @getimagesize($sourcePath);
        if ($info === false) {
            return false;
        }

        $mime = $info['mime'];
        switch ($mime) {
            case 'image/jpeg':
            case 'image/jpg':
                $image = @imagecreatefromjpeg($sourcePath);
                break;
            case 'image/png':
                $image = @imagecreatefrompng($sourcePath);
                if ($image) {
                    imagepalettetotruecolor($image);
                    imagealphablending($image, true);
                    imagesavealpha($image, true);
                }
                break;
            case 'image/gif':
                $image = @imagecreatefromgif($sourcePath);
                break;
            case 'image/webp':
                $image = @imagecreatefromwebp($sourcePath);
                break;
            default:
                return false;
        }

        if (!$image) {
            return false;
        }

        $result = @imagewebp($image, $destinationPath, $quality);
        @imagedestroy($image);
        return $result;
    }
}
