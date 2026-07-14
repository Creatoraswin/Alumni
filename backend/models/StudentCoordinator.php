<?php
/**
 * Student Coordinator Model
 * Handles CRUD for the student_coordinators table
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Validator.php';

class StudentCoordinator
{
    private $conn;
    private $table = 'student_coordinators';

    public function __construct($db) { $this->conn = $db; }

    public function getAll()
    {
        $query = "SELECT * FROM " . $this->table . " ORDER BY sort_order ASC, id ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getById($id)
    {
        $query = "SELECT * FROM " . $this->table . " WHERE id = :id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        return $stmt->fetch();
    }

    public function create($data)
    {
        $query = "INSERT INTO " . $this->table . " SET
            photo_url = :photo_url,
            name = :name,
            school = :school,
            branch = :branch,
            registration_no = :registration_no,
            sort_order = :sort_order";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':photo_url', $data['photo_url']);
        $stmt->bindParam(':name', $data['name']);
        $stmt->bindParam(':school', $data['school']);
        $stmt->bindParam(':branch', $data['branch']);
        $stmt->bindParam(':registration_no', $data['registration_no']);
        $sortOrder = isset($data['sort_order']) ? (int)$data['sort_order'] : 0;
        $stmt->bindParam(':sort_order', $sortOrder);

        if ($stmt->execute()) { return $this->conn->lastInsertId(); }
        return false;
    }

    public function update($id, $updates)
    {
        if (isset($updates['photo_url'])) {
            $coord = $this->getById($id);
            if ($coord && !empty($coord['photo_url']) && $coord['photo_url'] !== $updates['photo_url']) {
                $photoPath = ltrim($coord['photo_url'], '/');
                if (strpos($photoPath, 'Uploads/') === 0) {
                    $physicalPath = __DIR__ . '/../../' . $photoPath;
                    if (file_exists($physicalPath) && is_file($physicalPath)) {
                        unlink($physicalPath);
                    }
                }
            }
        }

        $setParts = [];
        $params = [':id' => $id];
        $allowedFields = ['photo_url', 'name', 'school', 'branch', 'registration_no', 'sort_order'];

        foreach ($updates as $field => $value) {
            if (in_array($field, $allowedFields)) {
                $setParts[] = "$field = :$field";
                $params[":$field"] = $value;
            }
        }
        if (empty($setParts)) { return false; }

        $query = "UPDATE " . $this->table . " SET " . implode(', ', $setParts) . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute($params);
    }

    public function delete($id)
    {
        $coord = $this->getById($id);
        if ($coord && !empty($coord['photo_url'])) {
            $photoPath = ltrim($coord['photo_url'], '/');
            if (strpos($photoPath, 'Uploads/') === 0) {
                $physicalPath = __DIR__ . '/../../' . $photoPath;
                if (file_exists($physicalPath) && is_file($physicalPath)) {
                    unlink($physicalPath);
                }
            }
        }

        $query = "DELETE FROM " . $this->table . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        return $stmt->execute();
    }
}
