<?php

class StudentStrength {
    private $conn;
    private $table_name = "student_strength";

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getAll() {
        $query = "SELECT id, registration_no, name, batch, school, program, branch, passout_year FROM " . $this->table_name . " ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function create($registration_no, $name, $batch, $school, $program, $branch, $passout_year) {
        $query = "INSERT INTO " . $this->table_name . " (registration_no, name, batch, school, program, branch, passout_year) VALUES (:registration_no, :name, :batch, :school, :program, :branch, :passout_year)";
        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(':registration_no', $registration_no);
        $stmt->bindParam(':name', $name);
        $stmt->bindParam(':batch', $batch);
        $stmt->bindParam(':school', $school);
        $stmt->bindParam(':program', $program);
        $stmt->bindParam(':branch', $branch);
        $stmt->bindParam(':passout_year', $passout_year);

        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    public function update($id, $registration_no, $name, $batch, $school, $program, $branch, $passout_year) {
        $query = "UPDATE " . $this->table_name . " SET registration_no = :registration_no, name = :name, batch = :batch, school = :school, program = :program, branch = :branch, passout_year = :passout_year WHERE id = :id";
        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(':registration_no', $registration_no);
        $stmt->bindParam(':name', $name);
        $stmt->bindParam(':batch', $batch);
        $stmt->bindParam(':school', $school);
        $stmt->bindParam(':program', $program);
        $stmt->bindParam(':branch', $branch);
        $stmt->bindParam(':passout_year', $passout_year);
        $stmt->bindParam(':id', $id);

        return $stmt->execute();
    }

    public function delete($id) {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        return $stmt->execute();
    }

    // Check if registration number exists
    public function exists($registration_no) {
        $query = "SELECT id FROM " . $this->table_name . " WHERE registration_no = :registration_no LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':registration_no', $registration_no);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC) !== false;
    }

    public function bulkCheckDuplicates($registration_nos) {
        if (empty($registration_nos)) return [];
        $inQuery = implode(',', array_fill(0, count($registration_nos), '?'));
        $query = "SELECT registration_no FROM " . $this->table_name . " WHERE registration_no IN (" . $inQuery . ")";
        $stmt = $this->conn->prepare($query);
        $stmt->execute($registration_nos);
        
        $duplicates = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $duplicates[] = $row['registration_no'];
        }
        return $duplicates;
    }
}
