<?php
/**
 * Alumni Spotlight Model
 * Handles all alumni spotlight operations
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Validator.php';

class AlumniSpotlight
{
    private $conn;
    private $table = 'alumni_spotlight';

    public function __construct($db) { $this->conn = $db; }

    public function getAll($showAll = false)
    {
        $query = "SELECT * FROM " . $this->table;
        if (!$showAll) { $query .= " WHERE status = 'Approved'"; }
        $query .= " ORDER BY date_added DESC";
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
            date_added = :date_added, name_of_alumni = :name_of_alumni,
            year_of_graduation = :year_of_graduation, school = :school,
            department = :department, registration_no = :registration_no,
            current_position = :current_position, company_organization = :company_organization,
            photo_url = :photo_url, achievement_story = :achievement_story,
            gallery_link = :gallery_link, status = :status";

        $stmt = $this->conn->prepare($query);
        $dateAdded = Validator::convertDateToMysql($data['date_added']);
        $stmt->bindParam(':date_added', $dateAdded);
        $stmt->bindParam(':name_of_alumni', $data['name_of_alumni']);
        $stmt->bindParam(':year_of_graduation', $data['year_of_graduation']);
        $stmt->bindParam(':school', $data['school']);
        $stmt->bindParam(':department', $data['department']);
        $stmt->bindParam(':registration_no', $data['registration_no']);
        $stmt->bindParam(':current_position', $data['current_position']);
        $stmt->bindParam(':company_organization', $data['company_organization']);
        $stmt->bindParam(':photo_url', $data['photo_url']);
        $stmt->bindParam(':achievement_story', $data['achievement_story']);
        $stmt->bindParam(':gallery_link', $data['gallery_link']);
        $status = $data['status'] ?? 'Pending';
        $stmt->bindParam(':status', $status);

        if ($stmt->execute()) { return $this->conn->lastInsertId(); }
        return false;
    }

    public function update($id, $updates)
    {
        $setParts = [];
        $params = [':id' => $id];
        $allowedFields = ['date_added', 'name_of_alumni', 'year_of_graduation', 'school',
            'department', 'registration_no', 'current_position', 'company_organization',
            'photo_url', 'achievement_story', 'gallery_link', 'status'];

        foreach ($updates as $field => $value) {
            if (in_array($field, $allowedFields)) {
                $setParts[] = "$field = :$field";
                if ($field === 'date_added') { $value = Validator::convertDateToMysql($value); }
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
        $query = "DELETE FROM " . $this->table . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        return $stmt->execute();
    }

    public function findByCriteria($criteria)
    {
        $whereParts = [];
        $params = [];
        if (isset($criteria['date_added'])) { $whereParts[] = "date_added = :date_added"; $params[':date_added'] = Validator::convertDateToMysql($criteria['date_added']); }
        if (isset($criteria['name_of_alumni'])) { $whereParts[] = "name_of_alumni = :name_of_alumni"; $params[':name_of_alumni'] = $criteria['name_of_alumni']; }
        if (isset($criteria['school'])) { $whereParts[] = "school = :school"; $params[':school'] = $criteria['school']; }
        if (isset($criteria['department'])) { $whereParts[] = "department = :department"; $params[':department'] = $criteria['department']; }
        if (empty($whereParts)) { return null; }

        $query = "SELECT * FROM " . $this->table . " WHERE " . implode(' AND ', $whereParts) . " LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        return $stmt->fetch();
    }

    public function updateStatus($id, $status)
    {
        $query = "UPDATE " . $this->table . " SET status = :status WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':id', $id);
        return $stmt->execute();
    }
}
