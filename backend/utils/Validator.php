<?php
/**
 * Validator Utility Class
 * 
 * Input validation and sanitization
 */

class Validator
{
    public static function sanitizeString($input)
    {
        return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
    }

    public static function isValidEmail($email)
    {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    public static function isValidPhone($phone)
    {
        return preg_match('/^[0-9]{10,15}$/', $phone);
    }

    public static function isValidDate($date)
    {
        if (preg_match('/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/', $date, $matches)) {
            return checkdate($matches[2], $matches[1], $matches[3]);
        }
        if (preg_match('/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/', $date, $matches)) {
            return checkdate($matches[2], $matches[3], $matches[1]);
        }
        return false;
    }

    public static function convertDateToMysql($date)
    {
        if (empty($date) || $date === 'NA') {
            return null;
        }
        // If it comes as YYYY-MM-DD, return as is
        if (preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $date)) {
            return $date;
        }
        // If it comes as DD/MM/YYYY or DD-MM-YYYY, convert to YYYY-MM-DD
        if (preg_match('/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/', $date, $matches)) {
            $day = str_pad($matches[1], 2, '0', STR_PAD_LEFT);
            $month = str_pad($matches[2], 2, '0', STR_PAD_LEFT);
            $year = $matches[3];
            return $year . '-' . $month . '-' . $day;
        }
        return $date;
    }

    public static function convertDateToDisplay($date)
    {
        if (empty($date) || $date === 'NA') {
            return 'NA';
        }
        if (preg_match('/^\d{2}\/\d{2}\/\d{4}$/', $date)) {
            return $date;
        }
        if (preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $date, $matches)) {
            return $matches[3] . '/' . $matches[2] . '/' . $matches[1];
        }
        return $date;
    }

    public static function validateRequired($data, $requiredFields)
    {
        $errors = [];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || empty(trim($data[$field]))) {
                $errors[] = ucfirst(str_replace('_', ' ', $field)) . ' is required';
            }
        }
        return $errors;
    }

    public static function sanitizeFilename($filename)
    {
        $filename = basename($filename);
        $filename = preg_replace('/[^a-zA-Z0-9._-]/', '_', $filename);
        return $filename;
    }
}
