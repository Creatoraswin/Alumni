<?php
/**
 * LinkedIn Status Model
 * Handles LinkedIn status tracking for alumni
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Validator.php';

class LinkedInStatus
{
    private $conn;
    private $table = 'linkedin_status';

    public function __construct($db) { $this->conn = $db; }

    public function getAll()
    {
        $query = "SELECT * FROM " . $this->table . " ORDER BY name ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getByRegistrationNo($registrationNo)
    {
        $query = "SELECT * FROM " . $this->table . " WHERE registration_no = :registration_no LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':registration_no', $registrationNo);
        $stmt->execute();
        return $stmt->fetch();
    }

    public function getByStatus($status)
    {
        $query = "SELECT * FROM " . $this->table . " WHERE current_status = :status ORDER BY name ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':status', $status);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getWithLinkedIn()
    {
        $query = "SELECT * FROM " . $this->table . " WHERE linkedin_id IS NOT NULL AND linkedin_id != '' ORDER BY name ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getWithoutLinkedIn()
    {
        $query = "SELECT * FROM " . $this->table . " WHERE linkedin_id IS NULL OR linkedin_id = '' ORDER BY name ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function create($data)
    {
        $query = "INSERT INTO " . $this->table . " SET
            registration_no = :registration_no, name = :name,
            linkedin_id = :linkedin_id, current_status = :current_status";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':registration_no', $data['registration_no']);
        $stmt->bindParam(':name', $data['name']);
        $stmt->bindParam(':linkedin_id', $data['linkedin_id']);
        $stmt->bindParam(':current_status', $data['current_status']);

        if ($stmt->execute()) { return $this->conn->lastInsertId(); }
        return false;
    }

    public function createFromRegistration($registrationNo, $name, $linkedinId = null)
    {
        $existing = $this->getByRegistrationNo($registrationNo);
        if ($existing) {
            return $this->update($registrationNo, ['name' => $name, 'linkedin_id' => $linkedinId]);
        } else {
            return $this->create([
                'registration_no' => $registrationNo, 'name' => $name,
                'linkedin_id' => $linkedinId, 'current_status' => null
            ]);
        }
    }

    public function bulkCreate($records)
    {
        $inserted = 0;
        foreach ($records as $record) {
            if ($this->create($record)) { $inserted++; }
        }
        return $inserted;
    }

    public function update($registrationNo, $updates)
    {
        $setParts = [];
        $params = [':registration_no' => $registrationNo];
        $allowedFields = ['name', 'linkedin_id', 'current_status'];

        foreach ($updates as $field => $value) {
            if (in_array($field, $allowedFields)) {
                $setParts[] = "$field = :$field";
                $params[":$field"] = $value;
            }
        }
        if (empty($setParts)) { return false; }

        $query = "UPDATE " . $this->table . " SET " . implode(', ', $setParts) .
            " WHERE registration_no = :registration_no";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute($params);
    }

    public function updateStatus($registrationNo, $status)
    {
        $query = "UPDATE " . $this->table . " SET current_status = :status WHERE registration_no = :registration_no";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':registration_no', $registrationNo);
        return $stmt->execute();
    }

    public function delete($registrationNo)
    {
        $query = "DELETE FROM " . $this->table . " WHERE registration_no = :registration_no";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':registration_no', $registrationNo);
        return $stmt->execute();
    }

    public function exists($registrationNo)
    {
        $query = "SELECT COUNT(*) as count FROM " . $this->table . " WHERE registration_no = :registration_no";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':registration_no', $registrationNo);
        $stmt->execute();
        $result = $stmt->fetch();
        return $result['count'] > 0;
    }

    public function getAllStatuses()
    {
        $query = "SELECT DISTINCT current_status FROM " . $this->table .
            " WHERE current_status IS NOT NULL AND current_status != '' ORDER BY current_status ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    public function getStatistics()
    {
        $stats = [];
        $query = "SELECT COUNT(*) as total FROM " . $this->table;
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $stats['total'] = $stmt->fetch()['total'];

        $query = "SELECT COUNT(*) as count FROM " . $this->table .
            " WHERE linkedin_id IS NOT NULL AND linkedin_id != ''";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $stats['with_linkedin'] = $stmt->fetch()['count'];
        $stats['without_linkedin'] = $stats['total'] - $stats['with_linkedin'];

        $query = "SELECT current_status, COUNT(*) as count FROM " . $this->table .
            " WHERE current_status IS NOT NULL AND current_status != '' GROUP BY current_status ORDER BY count DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $stats['by_status'] = $stmt->fetchAll();

        return $stats;
    }
}
