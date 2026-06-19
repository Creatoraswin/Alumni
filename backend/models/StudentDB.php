<?php
/**
 * StudentDB Model
 * Handles student enrollment database operations
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Validator.php';

class StudentDB
{
    private $conn;
    private $table = 'student_strength';

    public function __construct($db) { $this->conn = $db; }

    public function getAll()
    {
        $query = "SELECT * FROM " . $this->table . " ORDER BY passout_year DESC, name ASC";
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

    public function getByBatch($batch)
    {
        $query = "SELECT * FROM " . $this->table . " WHERE batch = :batch ORDER BY name ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':batch', $batch);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getByProgram($program)
    {
        $query = "SELECT * FROM " . $this->table . " WHERE program = :program ORDER BY passout_year DESC, name ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':program', $program);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getByPassoutYear($year)
    {
        $query = "SELECT * FROM " . $this->table . " WHERE passout_year = :year ORDER BY name ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':year', $year);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function create($data)
    {
        $query = "INSERT INTO " . $this->table . " SET
            registration_no = :registration_no, name = :name,
            batch = :batch, program = :program,
            branch = :branch, passout_year = :passout_year";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':registration_no', $data['registration_no']);
        $stmt->bindParam(':name', $data['name']);
        $stmt->bindParam(':batch', $data['batch']);
        $stmt->bindParam(':program', $data['program']);
        $stmt->bindParam(':branch', $data['branch']);
        $stmt->bindParam(':passout_year', $data['passout_year']);

        if ($stmt->execute()) { return $this->conn->lastInsertId(); }
        return false;
    }

    public function bulkCreate($students)
    {
        $inserted = 0;
        foreach ($students as $student) {
            if ($this->create($student)) { $inserted++; }
        }
        return $inserted;
    }

    public function update($registrationNo, $updates)
    {
        $setParts = [];
        $params = [':registration_no' => $registrationNo];
        $allowedFields = ['name', 'batch', 'program', 'branch', 'passout_year'];

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

    public function getAllBatches()
    {
        $query = "SELECT DISTINCT batch FROM " . $this->table . " WHERE batch IS NOT NULL ORDER BY batch DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    public function getAllPrograms()
    {
        $query = "SELECT DISTINCT program FROM " . $this->table . " WHERE program IS NOT NULL ORDER BY program ASC";
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

        $query = "SELECT program, COUNT(*) as count FROM " . $this->table .
            " WHERE program IS NOT NULL GROUP BY program ORDER BY count DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $stats['by_program'] = $stmt->fetchAll();

        $query = "SELECT passout_year, COUNT(*) as count FROM " . $this->table .
            " WHERE passout_year IS NOT NULL GROUP BY passout_year ORDER BY passout_year DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $stats['by_year'] = $stmt->fetchAll();

        return $stats;
    }
}
