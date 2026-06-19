<?php
/**
 * Student Model
 * Handles all student/alumni data operations
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Validator.php';

class Student
{
    private $conn;
    private $table = 'students';

    public function __construct($db)
    {
        $this->conn = $db;
    }

    public function getAll($showAll = false)
    {
        $query = "SELECT * FROM " . $this->table;
        if (!$showAll) {
            $query .= " WHERE status = 'Approved'";
        }
        $query .= " ORDER BY timestamp DESC";
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

    public function create($data)
    {
        $query = "INSERT INTO " . $this->table . " SET
            registration_no = :registration_no,
            name = :name,
            email = :email,
            personal_email = :personal_email,
            mobile_no = :mobile_no,
            dob = :dob,
            school = :school,
            programme = :programme,
            year_of_graduation = :year_of_graduation,
            current_position = :current_position,
            designation = :designation,
            organisation = :organisation,
            place_of_work = :place_of_work,
            present_occupation = :present_occupation,
            university_name = :university_name,
            area_of_study = :area_of_study,
            area_of_interest = :area_of_interest,
            location = :location,
            address = :address,
            linkedin_id = :linkedin_id,
            photo_url = :photo_url,
            feedback = :feedback,
            status = :status";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':registration_no', $data['registration_no']);
        $stmt->bindParam(':name', $data['name']);
        $stmt->bindParam(':email', $data['email']);
        $stmt->bindParam(':personal_email', $data['personal_email']);
        $stmt->bindParam(':mobile_no', $data['mobile_no']);
        $dob = Validator::convertDateToMysql($data['dob'] ?? null);
        $stmt->bindParam(':dob', $dob);
        $stmt->bindParam(':school', $data['school']);
        $stmt->bindParam(':programme', $data['programme']);
        $stmt->bindParam(':year_of_graduation', $data['year_of_graduation']);
        $stmt->bindParam(':current_position', $data['current_position']);
        $stmt->bindParam(':designation', $data['designation']);
        $stmt->bindParam(':organisation', $data['organisation']);
        $stmt->bindParam(':place_of_work', $data['place_of_work']);
        $stmt->bindParam(':present_occupation', $data['present_occupation']);
        $stmt->bindParam(':university_name', $data['university_name']);
        $stmt->bindParam(':area_of_study', $data['area_of_study']);
        $stmt->bindParam(':area_of_interest', $data['area_of_interest']);
        $stmt->bindParam(':location', $data['location']);
        $stmt->bindParam(':address', $data['address']);
        $stmt->bindParam(':linkedin_id', $data['linkedin_id']);
        $stmt->bindParam(':photo_url', $data['photo_url']);
        $stmt->bindParam(':feedback', $data['feedback']);
        $status = $data['status'] ?? 'Pending';
        $stmt->bindParam(':status', $status);

        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    public function update($registrationNo, $updates)
    {
        $setParts = [];
        $params = [':registration_no' => $registrationNo];

        $allowedFields = [
            'name', 'email', 'personal_email', 'mobile_no', 'dob',
            'school', 'programme', 'year_of_graduation', 'current_position',
            'designation', 'organisation', 'place_of_work', 'present_occupation',
            'university_name', 'area_of_study', 'area_of_interest', 'location',
            'address', 'linkedin_id', 'photo_url', 'feedback', 'status'
        ];

        foreach ($updates as $field => $value) {
            if (in_array($field, $allowedFields)) {
                $setParts[] = "$field = :$field";
                if ($field === 'dob') {
                    $value = Validator::convertDateToMysql($value);
                }
                $params[":$field"] = $value;
            }
        }

        if (empty($setParts)) {
            return false;
        }

        $query = "UPDATE " . $this->table . " SET " . implode(', ', $setParts) .
            " WHERE registration_no = :registration_no";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute($params);
    }

    public function delete($registrationNo)
    {
        $query = "DELETE FROM " . $this->table . " WHERE registration_no = :registration_no";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':registration_no', $registrationNo);
        return $stmt->execute();
    }

    public function updateStatus($registrationNo, $status)
    {
        $query = "UPDATE " . $this->table . " SET status = :status WHERE registration_no = :registration_no";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':registration_no', $registrationNo);
        return $stmt->execute();
    }
}
