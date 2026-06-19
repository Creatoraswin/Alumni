<?php
/**
 * Alumni Talk Model
 * Handles all alumni talk operations
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Validator.php';

class AlumniTalk
{
    private $conn;
    private $table = 'alumni_talks';

    public function __construct($db) { $this->conn = $db; }

    public function getAll()
    {
        $query = "SELECT * FROM " . $this->table . " ORDER BY date_of_event DESC";
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
            date_of_event = :date_of_event, name_of_alumni = :name_of_alumni,
            school = :school, department = :department, registration_no = :registration_no,
            banner_photo_url = :banner_photo_url, talk_on = :talk_on, gallery_link = :gallery_link";

        $stmt = $this->conn->prepare($query);
        $dateOfEvent = Validator::convertDateToMysql($data['date_of_event']);
        $stmt->bindParam(':date_of_event', $dateOfEvent);
        $stmt->bindParam(':name_of_alumni', $data['name_of_alumni']);
        $stmt->bindParam(':school', $data['school']);
        $stmt->bindParam(':department', $data['department']);
        $stmt->bindParam(':registration_no', $data['registration_no']);
        $stmt->bindParam(':banner_photo_url', $data['banner_photo_url']);
        $stmt->bindParam(':talk_on', $data['talk_on']);
        $stmt->bindParam(':gallery_link', $data['gallery_link']);

        if ($stmt->execute()) { return $this->conn->lastInsertId(); }
        return false;
    }

    public function update($id, $updates)
    {
        $setParts = [];
        $params = [':id' => $id];
        $allowedFields = ['date_of_event', 'name_of_alumni', 'school', 'department',
            'registration_no', 'banner_photo_url', 'talk_on', 'gallery_link'];

        foreach ($updates as $field => $value) {
            if (in_array($field, $allowedFields)) {
                $setParts[] = "$field = :$field";
                if ($field === 'date_of_event') { $value = Validator::convertDateToMysql($value); }
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
        if (isset($criteria['date_of_event'])) {
            $whereParts[] = "date_of_event = :date_of_event";
            $params[':date_of_event'] = Validator::convertDateToMysql($criteria['date_of_event']);
        }
        if (isset($criteria['name_of_alumni'])) {
            $whereParts[] = "name_of_alumni = :name_of_alumni";
            $params[':name_of_alumni'] = $criteria['name_of_alumni'];
        }
        if (isset($criteria['school'])) {
            $whereParts[] = "school = :school";
            $params[':school'] = $criteria['school'];
        }
        if (isset($criteria['department'])) {
            $whereParts[] = "department = :department";
            $params[':department'] = $criteria['department'];
        }
        if (empty($whereParts)) { return null; }

        $query = "SELECT * FROM " . $this->table . " WHERE " . implode(' AND ', $whereParts) . " LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        return $stmt->fetch();
    }
}
